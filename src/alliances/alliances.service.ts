import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GuildsService } from '../guilds/services/guilds.service';
import { Repository } from 'typeorm';
import { Alliance } from './entities/alliance.entity';
import {
  AllianceDto,
  AllianceRequestDto,
  GuildAllianceRequestsDto,
} from './dto/alliance.dto';

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

    if (existingRequest && existingRequest.status === 'PENDING') {
      throw new BadRequestException(
        'There is already a pending alliance request between these guilds',
      );
    }

    const newRequest = this.allianceRepository.create({
      requesterGuild,
      targetGuild,
      status: 'PENDING',
    });

    return this.allianceRepository.save(newRequest);
  }

  async acceptAllianceRequest(allianceId: number): Promise<AllianceDto> {
    const alliance = await this.allianceRepository.findOne({
      where: { id: allianceId },
      relations: [
        'requesterGuild',
        'requesterGuild.members',
        'requesterGuild.allies',
        'targetGuild',
        'targetGuild.members',
        'targetGuild.allies',
      ],
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

    return {
      ...alliance,
      requesterGuild: this.guildsService.toGuildSummaryDto(
        alliance.requesterGuild,
      ),
      targetGuild: this.guildsService.toGuildSummaryDto(alliance.targetGuild),
    };
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

  async getAllianceRequests(
    guildId: number,
  ): Promise<GuildAllianceRequestsDto> {
    const receivedRequests = await this.allianceRepository.find({
      where: { targetGuild: { id: guildId } },
      relations: [
        'requesterGuild',
        'requesterGuild.members',
        'requesterGuild.allies',
      ],
    });

    const sentRequests = await this.allianceRepository.find({
      where: { requesterGuild: { id: guildId } },
      relations: ['targetGuild', 'targetGuild.members', 'targetGuild.allies'],
    });

    const transformedReceivedRequests: AllianceRequestDto[] =
      receivedRequests.map((request) => {
        return {
          id: request.id,
          requesterGuild: this.guildsService.toGuildSummaryDto(
            request.requesterGuild,
          ),
          status: request.status,
        };
      });

    const transformedSentRequests: AllianceRequestDto[] = sentRequests.map(
      (request) => {
        return {
          id: request.id,
          targetGuild: this.guildsService.toGuildSummaryDto(
            request.targetGuild,
          ),
          status: request.status,
        };
      },
    );

    return {
      receivedAllianceRequests: transformedReceivedRequests,
      sentAllianceRequests: transformedSentRequests,
    };
  }
}
