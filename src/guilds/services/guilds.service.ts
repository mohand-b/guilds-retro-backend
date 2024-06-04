import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Guild } from '../entities/guild.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGuildDto } from '../dto/create-guild.dto';
import { User } from '../../users/entities/user.entity';
import { GuildDto, GuildSummaryDto } from '../dto/guild.dto';
import { convertBufferToBase64 } from '../../common/utils/image.utils';
import { UserRole } from '../../users/enum/user-role.enum';

@Injectable()
export class GuildsService {
  constructor(
    @InjectRepository(Guild)
    private guildRepository: Repository<Guild>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createGuildDto: CreateGuildDto, creator: User): Promise<Guild> {
    const logoBuffer: Buffer | null = createGuildDto.logo;

    const guild = this.guildRepository.create({
      ...createGuildDto,
      logo: logoBuffer,
      members: [creator],
    });

    await this.guildRepository.save(guild);
    return guild;
  }

  async findOne(id: number): Promise<Guild> {
    return this.guildRepository.findOne({
      where: { id: id },
      relations: ['allies'],
    });
  }

  async findCurrentGuild(userId: number): Promise<GuildDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['guild'],
    });

    if (!user || !user.guild) {
      throw new NotFoundException(
        'User not found or user is not part of any guild',
      );
    }

    const guild = await this.guildRepository.findOne({
      where: { id: user.guild.id },
      relations: ['members', 'allies', 'allies.members', 'allies.allies'],
    });

    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    const allies: GuildSummaryDto[] = guild.allies.map((ally) =>
      this.toGuildSummaryDto(ally),
    );

    return {
      ...guild,
      allies,
    };
  }

  async findRecruitingGuilds(): Promise<GuildSummaryDto[]> {
    const guilds = await this.guildRepository.find({
      where: { isRecruiting: true },
      relations: ['members', 'allies'],
    });

    return guilds
      .filter((guild) => guild.members.length <= guild.capacity)
      .map((guild) => this.toGuildSummaryDto(guild));
  }

  async findGuildsForAlliance(): Promise<GuildSummaryDto[]> {
    const guilds = await this.guildRepository.find({
      relations: ['members', 'allies'],
    });

    return guilds
      .filter((guild) => guild.allies.length < 3)
      .map((guild) => this.toGuildSummaryDto(guild));
  }

  toGuildSummaryDto(guild: Guild): GuildSummaryDto {
    const leader: User = guild.members.find(
      (member) => member.role === UserRole.LEADER,
    );

    const nbOfMembers: number = guild.members.length;
    const averageLevelOfMembers: number =
      nbOfMembers > 0
        ? Math.round(
            guild.members.reduce(
              (sum, member) => sum + (member.characterLevel || 0),
              0,
            ) / nbOfMembers,
          )
        : 0;

    return {
      id: guild.id,
      name: guild.name,
      level: guild.level,
      averageLevelOfMembers,
      capacity: guild.capacity,
      description: guild.description,
      nbOfMembers: guild.members.length,
      nbOfAllies: guild.allies.length,
      leaderUsername: leader ? leader.username : 'Unknown',
      logo: guild.logo ? convertBufferToBase64(guild.logo) : null,
    };
  }

  async addAlly(guildId: number, allyGuildId: number): Promise<void> {
    const guild = await this.guildRepository.findOne({
      where: { id: guildId },
      relations: ['allies'],
    });

    const allyGuild = await this.findOne(allyGuildId);

    if (!guild || !allyGuild) {
      throw new NotFoundException('Guild not found');
    }

    guild.allies.push(allyGuild);
    await this.guildRepository.save(guild);
  }

  async removeAlly(guildId: number, allyId: number): Promise<void> {
    const guild = await this.guildRepository.findOne({
      where: { id: guildId },
      relations: ['allies'],
    });

    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    guild.allies = guild.allies.filter((ally) => ally.id !== allyId);
    await this.guildRepository.save(guild);
  }
}
