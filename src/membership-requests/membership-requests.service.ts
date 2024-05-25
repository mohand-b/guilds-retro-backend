import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipRequest } from './entities/membership-request.entity';
import { RequestStatus } from './enum/request-status.enum';
import { UsersService } from '../users/users.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Guild } from '../guilds/entities/guild.entity';
import { UserRole } from '../users/enum/user-role.enum';
import { GuildsService } from '../guilds/services/guilds.service';
import { MembershipRequestDto } from './dto/membership-request.dto';

@Injectable()
export class MembershipRequestsService {
  constructor(
    @InjectRepository(MembershipRequest)
    private membershipRequestRepository: Repository<MembershipRequest>,
    @InjectRepository(Guild)
    private guildsRepository: Repository<Guild>,
    private guildsService: GuildsService,
    private usersService: UsersService,
  ) {}

  async createMembershipRequest(
    userId: number,
    guildId: number,
  ): Promise<MembershipRequestDto> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.guild) {
      throw new BadRequestException('User is already a member of a guild');
    }

    const guild = await this.guildsRepository.findOne({
      where: { id: guildId },
      relations: [
        'members',
        'allies',
        'membershipRequests',
        'membershipRequests.user',
      ],
    });

    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    if (!guild.membershipRequests) {
      guild.membershipRequests = [];
    }

    const existingRequest = guild.membershipRequests.find(
      (request) => request.user && request.user.id === userId,
    );
    if (existingRequest && existingRequest.status === RequestStatus.PENDING) {
      throw new BadRequestException('Membership request already exists');
    }

    const newRequest = new MembershipRequest();
    newRequest.user = user;
    newRequest.guild = guild;
    newRequest.status = RequestStatus.PENDING;
    newRequest.createdAt = new Date();

    await this.membershipRequestRepository.save(newRequest);
    return { ...newRequest, guild: this.guildsService.toLightGuildDto(guild) };
  }

  async acceptMembershipRequest(requestId: number): Promise<MembershipRequest> {
    const request = await this.membershipRequestRepository.findOne({
      where: { id: requestId },
      relations: ['user', 'guild'],
    });

    if (!request) {
      throw new NotFoundException('Membership request not found');
    }

    request.status = RequestStatus.APPROVED;
    request.user.role = UserRole.MEMBER;
    request.user.guild = request.guild;
    request.updatedAt = new Date();

    await this.membershipRequestRepository.save(request);
    await this.usersService.save(request.user);

    return request;
  }

  async rejectMembershipRequest(requestId: number): Promise<MembershipRequest> {
    const request = await this.membershipRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Membership request not found');
    }

    request.status = RequestStatus.REJECTED;
    request.updatedAt = new Date();

    await this.membershipRequestRepository.save(request);

    return request;
  }

  async findPendingRequestsForGuild(
    guildId: number,
  ): Promise<MembershipRequest[]> {
    return this.membershipRequestRepository.find({
      where: { guild: { id: guildId }, status: RequestStatus.PENDING },
      relations: ['user'],
    });
  }

  async findRequestsForUser(userId: number): Promise<MembershipRequestDto[]> {
    const requests = await this.membershipRequestRepository.find({
      where: { user: { id: userId } },
      relations: ['guild', 'guild.members', 'guild.allies', 'user'],
    });

    return requests.map((request) => ({
      ...request,
      guild: this.guildsService.toLightGuildDto(request.guild),
    }));
  }
}
