import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { FindOneOptions, MoreThan, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from './enum/user-role.enum';
import { Job } from './entities/job.entity';
import { AccountLinkRequest } from './entities/account-link-request.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { AccountLinkGroup } from './entities/account-link-group.entity';
import { OneWordQuestionnaire } from './entities/one-word-questionnaire.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(AccountLinkRequest)
    private linkRequestRepository: Repository<AccountLinkRequest>,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    @InjectRepository(AccountLinkGroup)
    private linkGroupRepository: Repository<AccountLinkGroup>,
    @InjectRepository(OneWordQuestionnaire)
    private questionnaireRepository: Repository<OneWordQuestionnaire>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const username = this.normalizeUsername(createUserDto.username);
    const existingUser = await this.userRepository.findOne({
      where: { username: this.normalizeUsername(username) },
    });
    if (existingUser) {
      throw new ConflictException('Username already taken');
    }

    const user = this.userRepository.create({
      ...createUserDto,
      username,
    });
    return this.userRepository.save(user);
  }

  async getCurrentUser(userId: number): Promise<User> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['guild', 'guild.allies', 'posts', 'questionnaire'],
    });
  }

  async save(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<any[]> {
    const users = await this.userRepository.find({ relations: ['guild'] });
    return users.map((user) => ({
      id: user.id,
      username: user.username,
      characterClass: user.characterClass,
      guildId: user.guild ? user.guild.id : null,
      role: user.role,
    }));
  }

  async findOneById(id: number, options?: FindOneOptions<User>): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      ...options,
    });

    if (!user) {
      throw new NotFoundException(`User with id '${id}' not found`);
    }

    return user;
  }

  async findOneByUsername(username: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { username: this.normalizeUsername(username) },
      relations: ['guild', 'guild.allies', 'linkGroup', 'questionnaire'],
    });

    if (!user) {
      throw new NotFoundException(`User with username '${username}' not found`);
    }

    const linkedAccounts = await this.getLinkedAccounts(user.id);

    return {
      ...user,
      linkedAccounts,
    };
  }

  async findMembersByGuild(guildId: number): Promise<User[]> {
    return this.userRepository.find({
      where: {
        guild: { id: guildId },
        role: Not(UserRole.CANDIDATE),
      },
    });
  }

  async updateFeedPreference(
    userId: number,
    feedClosingToGuildAndAllies: boolean,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.feedClosingToGuildAndAllies = feedClosingToGuildAndAllies;
    return this.userRepository.save(user);
  }

  async updateHideProfile(userId: number, hideProfile: boolean): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.hideProfile = hideProfile;
    return await this.userRepository.save(user);
  }

  async updateUserRole(userId: number, role: UserRole): Promise<User> {
    const user: User = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.role = role;
    return this.userRepository.save(user);
  }

  async addJobToUser(
    userId: number,
    jobName: string,
    level: number,
    isForgemaging: boolean,
  ): Promise<Job> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['jobs'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const normalJobs = user.jobs.filter((job) => !job.isForgemaging);
    const forgemagingJobs = user.jobs.filter((job) => job.isForgemaging);

    if (!isForgemaging && normalJobs.length >= 3) {
      throw new BadRequestException(
        'User already has the maximum number of normal jobs',
      );
    }

    if (isForgemaging && forgemagingJobs.length >= 3) {
      throw new BadRequestException(
        'User already has the maximum number of forgemaging jobs',
      );
    }

    const newJob = this.jobRepository.create({
      name: jobName,
      level,
      isForgemaging,
      user,
    });

    return this.jobRepository.save(newJob);
  }

  async updateJobLevel(
    userId: number,
    jobId: number,
    level: number,
  ): Promise<Job> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId, user: { id: userId } },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    job.level = level;

    return this.jobRepository.save(job);
  }

  async removeJob(userId: number, jobId: number): Promise<void> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId, user: { id: userId } },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    await this.jobRepository.remove(job);
  }

  async findUserForAccountLinking(
    requesterId: number,
    username: string,
  ): Promise<User> {
    const normalizedUsername = this.normalizeUsername(username);

    const targetUser = await this.userRepository.findOne({
      where: { username: normalizedUsername },
    });

    if (!targetUser) {
      throw new NotFoundException(`Aucun compte trouvé avec '${username}'.`);
    }

    const requester = await this.userRepository.findOne({
      where: { id: requesterId },
    });

    if (!requester) {
      throw new NotFoundException(
        `Problème avec ton identifiant, reconnecte-toi.`,
      );
    }

    const existingRequest = await this.linkRequestRepository.findOne({
      where: {
        requester: { id: requesterId },
        targetUser: { id: targetUser.id },
        createdAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)),
      },
    });

    if (existingRequest) {
      throw new ConflictException(
        'Tu as déjà une demande en attente pour ce compte.',
      );
    }

    return targetUser;
  }

  async requestLinkAccount(
    requesterId: number,
    targetUserId: number,
  ): Promise<AccountLinkRequest> {
    const requester = await this.userRepository.findOne({
      where: { id: requesterId },
    });
    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!requester || !targetUser) {
      throw new NotFoundException('User not found');
    }

    const existingRequest = await this.linkRequestRepository.findOne({
      where: {
        requester: { id: requesterId },
        targetUser: { id: targetUserId },
        createdAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)),
      },
    });

    if (existingRequest) {
      throw new ConflictException('A similar request is already pending');
    }

    const linkRequest = this.linkRequestRepository.create({
      requester,
      targetUser,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const savedRequest = await this.linkRequestRepository.save(linkRequest);

    await this.notificationsService.createNotification(
      targetUser.id,
      'link_account',
      `${requester.username} est ton compte ?`,
      undefined,
      undefined,
      savedRequest.id,
    );

    return savedRequest;
  }

  async acceptLinkRequest(requestId: number, userId: number): Promise<void> {
    const linkRequest = await this.linkRequestRepository.findOne({
      where: { id: requestId },
      relations: ['requester', 'targetUser'],
    });

    if (!linkRequest) {
      throw new NotFoundException('Link request not found');
    }

    if (linkRequest.targetUser.id !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to accept this request',
      );
    }

    const requester = await this.userRepository.findOne({
      where: { id: linkRequest.requester.id },
      relations: ['linkGroup'],
    });

    const targetUser = await this.userRepository.findOne({
      where: { id: linkRequest.targetUser.id },
      relations: ['linkGroup'],
    });

    const requesterGroup = await requester.linkGroup;
    const targetUserGroup = await targetUser.linkGroup;

    if (!requesterGroup && !targetUserGroup) {
      const newGroup = this.linkGroupRepository.create({
        users: [requester, targetUser],
      });
      await this.linkGroupRepository.save(newGroup);

      requester.linkGroup = Promise.resolve(newGroup);
      targetUser.linkGroup = Promise.resolve(newGroup);
      await this.userRepository.save([requester, targetUser]);
    } else if (requesterGroup && !targetUserGroup) {
      targetUser.linkGroup = Promise.resolve(requesterGroup);
      await this.userRepository.save(targetUser);
    } else if (!requesterGroup && targetUserGroup) {
      requester.linkGroup = Promise.resolve(targetUserGroup);
      await this.userRepository.save(requester);
    } else if (
      requesterGroup &&
      targetUserGroup &&
      requesterGroup.id !== targetUserGroup.id
    ) {
      const usersToMerge = targetUserGroup.users.map((user) => {
        user.linkGroup = Promise.resolve(requesterGroup);
        return user;
      });

      requesterGroup.users = [
        ...new Set([...requesterGroup.users, ...usersToMerge]),
      ];

      await this.linkGroupRepository.save(requesterGroup);
      await this.userRepository.save(usersToMerge);

      await this.linkGroupRepository.remove(targetUserGroup);
    }

    await this.notificationsService.cancelNotificationByLinkRequest(requestId);

    await this.linkRequestRepository.remove(linkRequest);
  }

  async getLinkedAccounts(userId: number): Promise<User[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['linkGroup', 'linkGroup.users'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const linkGroup = await user.linkGroup;

    if (!linkGroup) {
      return [];
    }

    const usersInGroup = linkGroup.users;

    if (!usersInGroup) {
      return [];
    }

    return usersInGroup.filter((u) => u.id !== userId);
  }

  async rejectLinkRequest(requestId: number, userId: number): Promise<void> {
    const linkRequest = await this.linkRequestRepository.findOne({
      where: { id: requestId },
      relations: ['requester', 'targetUser'],
    });

    if (!linkRequest) {
      throw new NotFoundException('Link request not found');
    }

    if (linkRequest.targetUser.id !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to reject this request',
      );
    }

    await this.notificationsService.cancelNotificationByLinkRequest(requestId);

    await this.notificationsService.createNotification(
      linkRequest.requester.id,
      'link_rejected',
      `${linkRequest.targetUser.username} a refusé ta demande de liaison de compte.`,
    );

    await this.linkRequestRepository.remove(linkRequest);
  }

  async updateQuestionnaire(
    userId: number,
    updateData: Partial<OneWordQuestionnaire>,
  ): Promise<OneWordQuestionnaire> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['questionnaire', 'linkGroup'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let questionnaire = user.questionnaire;
    if (!questionnaire) {
      questionnaire = this.questionnaireRepository.create({
        ...updateData,
        user,
      });
    } else {
      Object.assign(questionnaire, updateData);
    }

    await this.questionnaireRepository.save(questionnaire);

    if (user.linkGroup) {
      const linkGroup = await user.linkGroup;

      if (linkGroup) {
        const linkedUsers = await this.userRepository.find({
          where: { linkGroup: { id: linkGroup.id } },
        });

        if (linkedUsers && Array.isArray(linkedUsers)) {
          for (const linkedUser of linkedUsers) {
            if (linkedUser.id !== userId) {
              let linkedUserQuestionnaire =
                await this.questionnaireRepository.findOne({
                  where: { user: linkedUser },
                });

              if (!linkedUserQuestionnaire) {
                linkedUserQuestionnaire = this.questionnaireRepository.create({
                  ...updateData,
                  user: linkedUser,
                });
              } else {
                Object.assign(linkedUserQuestionnaire, updateData);
              }
              await this.questionnaireRepository.save(linkedUserQuestionnaire);
            }
          }
        }
      }
    }

    return questionnaire;
  }

  private normalizeUsername(username: string): string {
    if (!username) return username;
    return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
  }
}
