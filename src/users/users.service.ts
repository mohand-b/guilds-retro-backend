import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { FindOneOptions, MoreThan, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from './enum/user-role.enum';
import { UserDto } from './dto/user.dto';
import { Job } from './entities/job.entity';
import { AccountLinkRequest } from './entities/account-link-request.entity';
import { NotificationsService } from '../notifications/notifications.service';

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
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const username = this.normalizeUsername(createUserDto.username);
    const existingUser = await this.findOneByUsername(username);
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
      relations: ['guild', 'guild.allies', 'posts'],
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
    return this.userRepository.findOne({
      where: { id },
      ...options,
    });
  }

  async findOneByUsername(
    username: string,
    options?: FindOneOptions<User>,
  ): Promise<User> {
    return this.userRepository.findOne({
      where: { username: this.normalizeUsername(username) },
      ...options,
    });
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

  async updateUserRole(userId: number, role: UserRole): Promise<UserDto> {
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

  async requestLinkAccount(
    requesterId: number,
    targetUserId: number,
  ): Promise<AccountLinkRequest> {
    const requester = await this.userRepository.findOne({
      where: { id: requesterId },
      relations: ['linkedAccounts'],
    });
    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
      relations: ['linkedAccounts'],
    });

    if (!requester || !targetUser) {
      throw new NotFoundException('User not found');
    }

    const alreadyLinked = requester.linkedAccounts.some(
      (account) => account.id === targetUserId,
    );

    if (alreadyLinked) {
      throw new ConflictException('You are already linked to this account');
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
      'link_request',
      `${requester.username} est ton compte ?`,
      undefined,
      undefined,
      savedRequest.id,
    );

    return savedRequest;
  }

  private normalizeUsername(username: string): string {
    if (!username) return username;
    return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
  }
}
