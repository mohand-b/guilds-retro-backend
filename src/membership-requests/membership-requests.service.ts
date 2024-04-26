import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipRequest } from './entities/membership-request.entity';
import { RequestStatus } from './enum/membership-status.enum';
import { UsersService } from '../users/users.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Guild } from '../guilds/entities/guild.entity';

@Injectable()
export class MembershipRequestsService {
  constructor(
    @InjectRepository(MembershipRequest)
    private membershipRequestRepository: Repository<MembershipRequest>,
    @InjectRepository(Guild)
    private guildsRepository: Repository<Guild>,
    private usersService: UsersService,
  ) {}

  async createMembershipRequest(
    userId: number,
    guildId: number,
  ): Promise<MembershipRequest> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.guild) {
      throw new BadRequestException('User is already a member of a guild');
    }

    const guild = await this.guildsRepository.findOne({
      where: { id: guildId },
      relations: ['membershipRequests', 'membershipRequests.user'], // Assurez-vous que les utilisateurs des demandes sont chargés
    });

    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    if (!guild.membershipRequests) {
      guild.membershipRequests = []; // Initialisez le tableau s'il est indéfini
    }

    const existingRequest = guild.membershipRequests.find(
      (request) => request.user && request.user.id === userId,
    );
    if (existingRequest) {
      throw new BadRequestException('Membership request already exists');
    }

    const newRequest = new MembershipRequest();
    newRequest.user = user;
    newRequest.guild = guild;
    newRequest.status = RequestStatus.PENDING;

    await this.membershipRequestRepository.save(newRequest);
    return newRequest;
  }
}
