import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GuildsService } from '../guilds/services/guilds.service';
import { Repository } from 'typeorm';
import { Alliance } from './entities/alliance.entity';
import { AllianceDto, GuildAllianceRequestsDto } from './dto/alliance.dto';
import { AllianceStatusEnum } from './enum/alliance-status.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../users/enum/user-role.enum';
import { Guild } from '../guilds/entities/guild.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AlliancesService {
  constructor(
    private guildsService: GuildsService,
    @InjectRepository(Alliance)
    private allianceRepository: Repository<Alliance>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Guild)
    private guildRepository: Repository<Guild>,
    private notificationService: NotificationsService,
  ) {}

  async createAllianceRequest(
    requesterGuildId: number,
    targetGuildId: number,
  ): Promise<Alliance> {
    if (requesterGuildId === targetGuildId) {
      throw new BadRequestException('A guild cannot ally with itself.');
    }

    const [requesterGuild, targetGuild] = await Promise.all([
      this.guildRepository.findOne({
        where: { id: requesterGuildId },
        relations: ['allies'],
      }),
      this.guildRepository.findOne({
        where: { id: targetGuildId },
        relations: ['allies'],
      }),
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

    const newRequest = this.allianceRepository.create({
      requesterGuild,
      targetGuild,
      status: 'PENDING',
    });

    const targetGuildLeader = await this.userRepository.findOne({
      where: { guild: { id: targetGuild.id }, role: UserRole.LEADER },
    });

    await this.notificationService.createNotification(
      targetGuildLeader.id,
      'alliance_request',
      `La guilde ${requesterGuild.name} souhaite s'allier avec ${targetGuild.name}`,
      undefined,
      undefined,
      undefined,
      newRequest.id,
    );

    return this.allianceRepository.save(newRequest);
  }

  async dissolveAlliance(
    guildId1: number,
    guildId2: number,
  ): Promise<AllianceDto> {
    const alliance = await this.allianceRepository.findOne({
      where: [
        {
          requesterGuild: { id: guildId1 },
          targetGuild: { id: guildId2 },
        },
        {
          requesterGuild: { id: guildId2 },
          targetGuild: { id: guildId1 },
        },
      ],
      relations: ['requesterGuild', 'targetGuild'],
    });

    if (!alliance) {
      throw new NotFoundException('Alliance not found');
    }

    alliance.status = AllianceStatusEnum.DISSOLVED;
    await this.allianceRepository.save(alliance);

    await Promise.all([
      this.guildsService.removeAlly(
        alliance.requesterGuild.id,
        alliance.targetGuild.id,
      ),
      this.guildsService.removeAlly(
        alliance.targetGuild.id,
        alliance.requesterGuild.id,
      ),
    ]);

    return {
      ...alliance,
      requesterGuild: this.guildsService.toGuildSummaryDto(
        alliance.requesterGuild,
      ),
      targetGuild: this.guildsService.toGuildSummaryDto(alliance.targetGuild),
    };
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

    if (alliance.status !== AllianceStatusEnum.PENDING) {
      throw new Error('Alliance request is not pending');
    }

    alliance.status = AllianceStatusEnum.ACCEPTED;
    await this.allianceRepository.save(alliance);

    await Promise.all([
      this.guildsService.addAlly(
        alliance.requesterGuild.id,
        alliance.targetGuild.id,
      ),
      this.guildsService.addAlly(
        alliance.targetGuild.id,
        alliance.requesterGuild.id,
      ),
    ]);

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

    alliance.status = AllianceStatusEnum.REJECTED;
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

    return {
      receivedAllianceRequests: receivedRequests.map((request) => ({
        id: request.id,
        requesterGuild: this.guildsService.toGuildSummaryDto(
          request.requesterGuild,
        ),
        status: request.status,
      })),
      sentAllianceRequests: sentRequests.map((request) => ({
        id: request.id,
        targetGuild: this.guildsService.toGuildSummaryDto(request.targetGuild),
        status: request.status,
      })),
    };
  }
}
