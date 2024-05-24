import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GuildsService } from '../guilds/services/guilds.service';
import { Repository } from 'typeorm';
import { Alliance } from './entities/alliance.entity';

@Injectable()
export class AlliancesService {
  constructor(
    private guildsService: GuildsService,
    @InjectRepository(Alliance)
    private allianceRepository: Repository<Alliance>,
  ) {}

  async createAllianceRequest(
    requesterGuildId: number,
    targetGuildId: number,
  ): Promise<Alliance> {
    if (requesterGuildId === targetGuildId) {
      throw new BadRequestException('A guild cannot ally with itself.');
    }

    const [requesterGuild, targetGuild] = await Promise.all([
      this.guildsService.findOne(requesterGuildId),
      this.guildsService.findOne(targetGuildId),
    ]);

    if (!requesterGuild || !targetGuild) {
      throw new NotFoundException('One or both guilds not found');
    }

    const areAlreadyAllies = requesterGuild.allies.some(
      (ally) => ally.id === targetGuildId,
    );
    if (areAlreadyAllies) {
      throw new BadRequestException('These guilds are already allied');
    }

    const existingRequest = await this.allianceRepository.findOne({
      where: [
        { requesterGuild: requesterGuild, targetGuild: targetGuild },
        { requesterGuild: targetGuild, targetGuild: requesterGuild },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        throw new BadRequestException(
          'There is already a pending alliance request between these guilds',
        );
      } else {
        throw new BadRequestException(
          'An alliance request already exists and was processed',
        );
      }
    }

    const newRequest = this.allianceRepository.create({
      requesterGuild,
      targetGuild,
      status: 'PENDING',
    });

    return this.allianceRepository.save(newRequest);
  }

  async acceptAllianceRequest(allianceId: number): Promise<Alliance> {
    const alliance = await this.allianceRepository.findOne({
      where: { id: allianceId },
      relations: ['requesterGuild', 'targetGuild'],
    });

    if (!alliance) {
      throw new NotFoundException('Alliance request not found');
    }

    if (alliance.status !== 'PENDING') {
      throw new Error('Alliance request is not pending');
    }

    alliance.status = 'ACCEPTED';
    await this.allianceRepository.save(alliance);

    await this.guildsService.addAlly(
      alliance.requesterGuild.id,
      alliance.targetGuild.id,
    );
    await this.guildsService.addAlly(
      alliance.targetGuild.id,
      alliance.requesterGuild.id,
    );

    return alliance;
  }

  async rejectAllianceRequest(allianceId: number): Promise<Alliance> {
    const alliance = await this.allianceRepository.findOne({
      where: { id: allianceId },
    });

    if (!alliance) {
      throw new NotFoundException('Alliance request not found');
    }

    alliance.status = 'REJECTED';
    await this.allianceRepository.save(alliance);

    return alliance;
  }

  async getPendingAllianceRequests(guildId: number): Promise<Alliance[]> {
    const pendingRequests = await this.allianceRepository.find({
      where: { targetGuild: { id: guildId }, status: 'PENDING' },
      relations: ['requesterGuild', 'targetGuild'],
    });

    if (!pendingRequests) {
      throw new NotFoundException(
        `No pending alliance requests found for guild with ID ${guildId}`,
      );
    }

    return pendingRequests;
  }
}
