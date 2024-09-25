import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Guild } from '../entities/guild.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGuildDto } from '../dto/create-guild.dto';
import { User } from '../../users/entities/user.entity';
import { GuildDto, PaginatedMemberResponseDto } from '../dto/guild.dto';
import { convertBufferToBase64 } from '../../common/utils/image.utils';
import { UserRole } from '../../users/enum/user-role.enum';
import { MemberDto } from '../../users/dto/user.dto';
import { CharacterClass } from '../../users/enum/character-class.enum';
import {
  GuildSearchDto,
  GuildSearchResponseDto,
  PaginatedGuildSearchResponseDto,
} from '../dto/guild-search.dto';
import { Event } from '../../events/entities/event';
import { differenceInMonths, differenceInWeeks } from 'date-fns';
import { EventStatsDto } from '../dto/guild-stats.dto';

@Injectable()
export class GuildsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Guild)
    private readonly guildRepository: Repository<Guild>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
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
      where: { id },
      relations: ['allies', 'members'],
    });
  }

  async getGuildById(userId: number, guildId: number): Promise<GuildDto> {
    const user: User = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['guild', 'guild.allies'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAlly: boolean = this.isAlly(user.guild, guildId);

    const guild: Guild = await this.guildRepository.findOne({
      where: { id: guildId },
      relations: ['allies', 'allies.members'],
      select: [
        'id',
        'name',
        'description',
        'logo',
        'level',
        'allowAlliances',
        'hideStats',
      ],
    });

    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    const memberCount: number = await this.userRepository.count({
      where: { guild: { id: guildId } },
    });

    const leader = await this.userRepository.findOne({
      where: { guild: { id: guildId }, role: UserRole.LEADER },
      select: ['id', 'username'],
    });

    const allies: GuildDto[] = isAlly
      ? guild.allies.map((ally) => this.toAllySummaryDto(ally))
      : [];

    const allyCount: number = guild.allies.length;

    return {
      id: guild.id,
      name: guild.name,
      description: guild.description,
      logo: guild.logo ? convertBufferToBase64(guild.logo) : null,
      level: guild.level,
      memberCount,
      isAlly,
      allowAlliances: guild.allowAlliances,
      allies,
      allyCount,
      leaderUsername: leader ? leader.username : 'Unknown',
      hideStats: guild.hideStats,
    };
  }

  async getCurrentGuild(userId: number): Promise<GuildDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['guild'],
      select: ['id', 'guild'],
    });

    if (!user || !user.guild) {
      throw new NotFoundException(
        'User not found or user is not part of any guild',
      );
    }

    const guild = await this.guildRepository.findOne({
      where: { id: user.guild.id },
      relations: ['allies', 'allies.members'],
      select: [
        'id',
        'name',
        'description',
        'logo',
        'level',
        'allowAlliances',
        'hideStats',
      ],
    });

    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    const memberCount = await this.userRepository.count({
      where: { guild: { id: guild.id } },
    });

    const leader = await this.userRepository.findOne({
      where: { guild: { id: guild.id }, role: UserRole.LEADER },
      select: ['id', 'username'],
    });

    const allies = guild.allies.map((ally) => this.toAllySummaryDto(ally));

    return {
      id: guild.id,
      name: guild.name,
      description: guild.description,
      logo: guild.logo ? convertBufferToBase64(guild.logo) : null,
      level: guild.level,
      memberCount,
      allowAlliances: guild.allowAlliances,
      allies,
      leaderUsername: leader ? leader.username : 'Unknown',
      hideStats: guild.hideStats,
    };
  }

  async searchGuilds(
    guildSearchDto: GuildSearchDto,
  ): Promise<PaginatedGuildSearchResponseDto> {
    const { name, minAverageLevel, page = 1, limit = 10 } = guildSearchDto;

    const queryBuilder = this.guildRepository
      .createQueryBuilder('guild')
      .leftJoin('guild.members', 'member')
      .addSelect('COUNT(member.id)', 'membersCount')
      .addSelect('AVG(member.characterLevel)', 'averageLevel')
      .groupBy('guild.id');

    if (name) {
      queryBuilder.andWhere('guild.name ILIKE :name', { name: `%${name}%` });
    }

    if (minAverageLevel) {
      queryBuilder.having('AVG(member.characterLevel) >= :minAverageLevel', {
        minAverageLevel,
      });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const { entities: guilds, raw } = await queryBuilder.getRawAndEntities();

    const results: GuildSearchResponseDto[] = guilds.map((guild, index) => ({
      id: guild.id,
      name: guild.name,
      logo: guild.logo,
      membersCount: parseInt(raw[index]['membersCount'], 10) || 0,
      averageLevel: Math.round(parseFloat(raw[index]['averageLevel']) || 0),
    }));

    return {
      total: guilds.length,
      page,
      limit,
      results,
    };
  }

  async findRecruitingGuilds(): Promise<GuildDto[]> {
    const guilds = await this.guildRepository
      .createQueryBuilder('guild')
      .select([
        'guild.id',
        'guild.name',
        'guild.description',
        'guild.logo',
        'guild.level',
        'guild.capacity',
      ])
      .leftJoin('guild.members', 'member')
      .leftJoin('guild.allies', 'ally')
      .leftJoin('guild.members', 'leader', 'leader.role = :leaderRole', {
        leaderRole: UserRole.LEADER,
      })
      .where('guild.isRecruiting = true')
      .groupBy('guild.id')
      .addGroupBy('leader.username')
      .having('COUNT(member.id) < guild.capacity')
      .addSelect('COUNT(DISTINCT member.id)', 'memberCount')
      .addSelect('COUNT(DISTINCT ally.id)', 'allyCount')
      .addSelect('AVG(member.characterLevel)', 'averageLevelOfMembers')
      .addSelect('leader.username', 'leaderUsername')
      .getRawMany();

    const guildDtos: GuildDto[] = guilds.map((guildRaw) => ({
      id: guildRaw.guild_id,
      name: guildRaw.guild_name,
      description: guildRaw.guild_description,
      logo: guildRaw.guild_logo
        ? convertBufferToBase64(guildRaw.guild_logo)
        : null,
      level: guildRaw.guild_level,
      capacity: guildRaw.guild_capacity,
      leaderUsername: guildRaw.leaderUsername || 'Unknown',
      memberCount: parseInt(guildRaw.memberCount, 10) || 0,
      allyCount: parseInt(guildRaw.allyCount, 10) || 0,
      averageLevelOfMembers: Math.round(
        parseFloat(guildRaw.averageLevelOfMembers) || 0,
      ),
    }));

    return guildDtos;
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

  async getPaginatedMembers(
    guildId: number,
    page = 1,
    limit = 10,
  ): Promise<PaginatedMemberResponseDto> {
    const [members, total] = await this.userRepository
      .createQueryBuilder('user')
      .where('user.guildId = :guildId', { guildId })
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const memberDtos = members.map((member) => this.toMemberDto(member));

    return {
      results: memberDtos,
      total,
      page,
      limit,
    };
  }

  toGuildDto(guild: Guild): GuildDto {
    const leader = guild.members.find(
      (member) => member.role === UserRole.LEADER,
    );

    const memberCount = guild.members.length;
    const averageLevelOfMembers = memberCount
      ? Math.round(
          guild.members.reduce(
            (sum, member) => sum + (member.characterLevel || 0),
            0,
          ) / memberCount,
        )
      : 0;

    return {
      id: guild.id,
      name: guild.name,
      level: guild.level,
      logo: guild.logo ? convertBufferToBase64(guild.logo) : null,
      capacity: guild.capacity,
      averageLevelOfMembers,
      description: guild.description,
      memberCount,
      allyCount: guild.allies ? guild.allies.length : 0,
      leaderUsername: leader ? leader.username : 'Unknown',
      hideStats: guild.hideStats,
    };
  }

  toMemberDto(user: User): MemberDto {
    return {
      id: user.id,
      username: user.username,
      characterClass: user.characterClass,
      gender: user.gender,
      characterLevel: user.characterLevel,
      role: user.role,
    };
  }

  toAllySummaryDto(guild: Guild): GuildDto {
    const leader = guild.members.find(
      (member) => member.role === UserRole.LEADER,
    );

    const memberCount = guild.members.length;
    const averageLevelOfMembers = memberCount
      ? Math.round(
          guild.members.reduce(
            (sum, member) => sum + (member.characterLevel || 0),
            0,
          ) / memberCount,
        )
      : 0;

    return {
      id: guild.id,
      name: guild.name,
      description: guild.description,
      level: guild.level,
      logo: guild.logo ? convertBufferToBase64(guild.logo) : null,
      averageLevelOfMembers,
      memberCount,
      leaderUsername: leader ? leader.username : 'Unknown',
    };
  }

  isAlly(userGuild: Guild, guildId: number): boolean {
    return userGuild.allies.some((ally) => ally.id === guildId);
  }

  async getMemberClassesCount(
    guildId: number,
  ): Promise<Record<CharacterClass, number>> {
    const result = await this.dataSource.manager.query(
      `
          SELECT "characterClass", COUNT(*) as count
          FROM "user"
          WHERE "guildId" = $1
          GROUP BY "characterClass"
      `,
      [guildId],
    );

    const memberClassesCount: Record<CharacterClass, number> = Object.values(
      CharacterClass,
    ).reduce(
      (acc, key) => {
        acc[key] = 0;
        return acc;
      },
      {} as Record<CharacterClass, number>,
    );

    result.forEach((row: { characterClass: CharacterClass; count: string }) => {
      memberClassesCount[row.characterClass] = parseInt(row.count, 10);
    });

    return memberClassesCount;
  }

  async getEventStats(guildId: number): Promise<EventStatsDto> {
    const guild = await this.guildRepository.findOne({
      where: { id: guildId },
      relations: ['members'],
    });

    if (!guild) {
      throw new NotFoundException('Guilde non trouvée');
    }

    const memberIds = guild.members.map((member) => member.id);

    const events = await this.eventRepository
      .createQueryBuilder('event')
      .where('event.creatorId IN (:...memberIds)', { memberIds })
      .getMany();

    const weeksSinceCreation = differenceInWeeks(
      new Date(),
      guild.creationDate,
    );
    const monthsSinceCreation = differenceInMonths(
      new Date(),
      guild.creationDate,
    );

    const totalEvents = events.length;

    const averageEventsPerWeek =
      weeksSinceCreation > 0 ? totalEvents / weeksSinceCreation : totalEvents;

    const averageEventsPerMonth =
      monthsSinceCreation > 0 ? totalEvents / monthsSinceCreation : totalEvents;

    const totalEventsByType = events.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalEvents,
      totalEventsByType,
      averageEventsPerWeek,
      averageEventsPerMonth,
    };
  }

  async getAverageMemberLevel(guildId: number): Promise<number> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .select('ROUND(AVG(user.characterLevel))', 'averageLevel')
      .where('user.guildId = :guildId', { guildId })
      .getRawOne();

    const averageLevel = parseInt(result.averageLevel, 10);
    return isNaN(averageLevel) ? 0 : averageLevel;
  }

  async updateGuildLevel(guildId: number, newLevel: number): Promise<GuildDto> {
    const guild = await this.guildRepository.findOne({
      where: { id: guildId },
      relations: ['members'],
    });

    if (!guild) {
      throw new NotFoundException('Guilde non trouvée');
    }

    guild.level = newLevel;

    await this.guildRepository.save(guild);

    return this.toGuildDto(guild);
  }

  async updateHideStats(
    guildId: number,
    hideStats: boolean,
  ): Promise<GuildDto> {
    const guild = await this.guildRepository.findOne({
      where: { id: guildId },
      relations: ['members'],
    });

    if (!guild) {
      throw new NotFoundException('Guilde non trouvée');
    }

    guild.hideStats = hideStats;

    await this.guildRepository.save(guild);

    return this.toGuildDto(guild);
  }
}
