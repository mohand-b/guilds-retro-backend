import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Guild } from '../entities/guild.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGuildDto } from '../dto/create-guild.dto';
import { User } from '../../users/entities/user.entity';
import {
  AllySummaryDto,
  GuildDto,
  GuildSummaryDto,
  PaginatedMemberResponseDto,
} from '../dto/guild.dto';
import { convertBufferToBase64 } from '../../common/utils/image.utils';
import { UserRole } from '../../users/enum/user-role.enum';
import { MemberDto } from '../../users/dto/user.dto';
import { CharacterClass } from '../../users/enum/character-class.enum';
import {
  GuildSearchDto,
  GuildSearchResponseDto,
  PaginatedGuildSearchResponseDto,
} from '../dto/guild-search.dto';

@Injectable()
export class GuildsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Guild)
    private readonly guildRepository: Repository<Guild>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  async getGuildById(
    userId: number,
    guildId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<GuildDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['guild', 'guild.allies'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const guild = await this.guildRepository.findOne({
      where: { id: guildId },
      relations: ['members', 'allies', 'allies.members'],
    });

    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    const isAlly = user.guild.allies.some((ally) => ally.id === guild.id);

    const paginatedMembers = isAlly
      ? await this.getPaginatedMembers(guild.id, page, limit)
      : { results: [], total: 0, page, limit };

    const allies = isAlly
      ? guild.allies.map((ally) => this.toAllySummaryDto(ally))
      : [];

    return {
      id: guild.id,
      name: guild.name,
      description: guild.description,
      logo: guild.logo ? convertBufferToBase64(guild.logo) : null,
      level: guild.level,
      members: paginatedMembers,
      allies,
    };
  }

  async getCurrentGuild(userId: number): Promise<GuildDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['guild', 'guild.members', 'guild.allies'],
    });

    if (!user || !user.guild) {
      throw new NotFoundException(
        'User not found or user is not part of any guild',
      );
    }

    const guild = await this.guildRepository.findOne({
      where: { id: user.guild.id },
      relations: ['allies', 'allies.members'],
    });

    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    const allies = guild.allies.map((ally) => this.toAllySummaryDto(ally));

    return {
      id: guild.id,
      name: guild.name,
      description: guild.description,
      logo: guild.logo ? convertBufferToBase64(guild.logo) : null,
      level: guild.level,
      allies,
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

  async findGuildsForAlliance(): Promise<GuildSummaryDto[]> {
    const guilds = await this.guildRepository.find({
      relations: [
        'members',
        'members.guild',
        'members.guild.allies',
        'allies',
        'allies.members',
      ],
    });

    const eligibleGuilds = guilds.filter((guild) => guild.allies.length < 3);

    const guildsSummary = eligibleGuilds.map((guild) =>
      this.toGuildSummaryDto(guild),
    );

    return guildsSummary;
  }

  async findRecruitingGuilds(): Promise<GuildSummaryDto[]> {
    const guilds = await this.guildRepository.find({
      where: { isRecruiting: true },
      relations: ['members', 'allies'],
    });

    const recruitingGuilds = guilds.filter(
      (guild) => guild.members.length <= guild.capacity,
    );

    const guildsSummary = await Promise.all(
      recruitingGuilds.map((guild) => this.toGuildSummaryDto(guild)),
    );

    return guildsSummary;
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

  toGuildSummaryDto(guild: Guild): GuildSummaryDto {
    const leader = guild.members.find(
      (member) => member.role === UserRole.LEADER,
    );

    const nbOfMembers = guild.members.length;
    const averageLevelOfMembers = nbOfMembers
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
      logo: guild.logo ? convertBufferToBase64(guild.logo) : null,
      capacity: guild.capacity,
      averageLevelOfMembers,
      description: guild.description,
      nbOfMembers,
      nbOfAllies: guild.allies ? guild.allies.length : 0,
      leaderUsername: leader ? leader.username : 'Unknown',
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

  toAllySummaryDto(guild: Guild): AllySummaryDto {
    const leader = guild.members.find(
      (member) => member.role === UserRole.LEADER,
    );

    const nbOfMembers = guild.members.length;
    const averageLevelOfMembers = nbOfMembers
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
      logo: guild.logo ? convertBufferToBase64(guild.logo) : null,
      averageLevelOfMembers,
      nbOfMembers,
      leaderUsername: leader ? leader.username : 'Unknown',
    };
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
}
