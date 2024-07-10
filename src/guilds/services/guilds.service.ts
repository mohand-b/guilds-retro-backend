import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Guild } from '../entities/guild.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGuildDto } from '../dto/create-guild.dto';
import { User } from '../../users/entities/user.entity';
import { GuildDto, GuildSummaryDto } from '../dto/guild.dto';
import { convertBufferToBase64 } from '../../common/utils/image.utils';
import { UserRole } from '../../users/enum/user-role.enum';
import { MemberDto } from '../../users/dto/user.dto';
import { CharacterClass } from '../../users/enum/character-class.enum';

@Injectable()
export class GuildsService {
  constructor(
    @InjectRepository(Guild)
    private readonly guildRepository: Repository<Guild>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(id: number): Promise<Guild> {
    return this.guildRepository.findOne({
      where: { id },
      relations: ['allies'],
    });
  }

  async findById(
    userId: number,
    guildId: number,
  ): Promise<GuildDto | GuildSummaryDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['guild', 'guild.allies'],
    });

    if (!user || !user.guild) {
      throw new NotFoundException(
        'User not found or user is not part of any guild',
      );
    }

    const targetGuild = await this.guildRepository.findOne({
      where: { id: guildId },
      relations: [
        'members',
        'members.guild',
        'members.guild.allies',
        'allies',
        'allies.members',
      ],
    });

    if (!targetGuild) {
      throw new NotFoundException('Guild not found');
    }

    const memberClassesCount: Record<CharacterClass, number> = Object.values(
      CharacterClass,
    ).reduce(
      (acc, key) => {
        acc[key] = 0;
        return acc;
      },
      {} as Record<CharacterClass, number>,
    );

    targetGuild.members.forEach((member) => {
      if (member.characterClass in memberClassesCount) {
        memberClassesCount[member.characterClass]++;
      }
    });

    const isAlly = user.guild.allies.some((ally) => ally.id === targetGuild.id);

    if (isAlly) {
      const members = targetGuild.members.map((member) =>
        this.toMemberDto(member),
      );
      const allies = targetGuild.allies.map((ally) =>
        this.toGuildSummaryDto(ally),
      );

      return {
        id: targetGuild.id,
        name: targetGuild.name,
        description: targetGuild.description,
        logo: targetGuild.logo,
        level: targetGuild.level,
        members,
        memberClassesCount,
        allies,
      };
    } else {
      return this.toGuildSummaryDto(targetGuild);
    }
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
      relations: [
        'members',
        'members.guild',
        'members.guild.allies',
        'allies',
        'allies.members',
      ],
    });

    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    const members = guild.members.map((member) => this.toMemberDto(member));
    const allies = guild.allies.map((ally) => this.toGuildSummaryDto(ally));

    const memberClassesCount: Record<CharacterClass, number> = Object.values(
      CharacterClass,
    ).reduce(
      (acc, key) => {
        acc[key] = 0;
        return acc;
      },
      {} as Record<CharacterClass, number>,
    );

    guild.members.forEach((member) => {
      if (member.characterClass in memberClassesCount) {
        memberClassesCount[member.characterClass]++;
      }
    });

    return {
      id: guild.id,
      name: guild.name,
      description: guild.description,
      logo: guild.logo,
      level: guild.level,
      members,
      memberClassesCount,
      allies,
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

    return guilds
      .filter((guild) => guild.allies.length < 3)
      .map((guild) => this.toGuildSummaryDto(guild));
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

  toGuildSummaryDto(guild: Guild): GuildSummaryDto {
    const leader = guild.members
      ? guild.members.find((member) => member.role === UserRole.LEADER)
      : null;

    const nbOfMembers = guild.members ? guild.members.length : 0;
    const averageLevelOfMembers =
      nbOfMembers > 0
        ? Math.round(
            guild.members.reduce(
              (sum, member) => sum + (member.characterLevel || 0),
              0,
            ) / nbOfMembers,
          )
        : 0;

    const memberClassesCount: Record<CharacterClass, number> = Object.values(
      CharacterClass,
    ).reduce(
      (acc, key) => {
        acc[key] = 0;
        return acc;
      },
      {} as Record<CharacterClass, number>,
    );

    if (guild.members) {
      guild.members.forEach((member) => {
        if (member.characterClass in memberClassesCount) {
          memberClassesCount[member.characterClass]++;
        }
      });
    }

    return {
      id: guild.id,
      name: guild.name,
      level: guild.level,
      averageLevelOfMembers,
      memberClassesCount,
      capacity: guild.capacity,
      description: guild.description,
      nbOfMembers,
      nbOfAllies: guild.allies ? guild.allies.length : 0,
      leaderUsername: leader ? leader.username : 'Unknown',
      logo: guild.logo ? convertBufferToBase64(guild.logo) : null,
    };
  }

  toMemberDto(user: User): MemberDto {
    return {
      id: user.id,
      username: user.username,
      characterClass: user.characterClass,
      gender: user.gender,
      characterLevel: user.characterLevel,
      guild: {
        id: user.guild.id,
        name: user.guild.name,
        description: user.guild.description,
        level: user.guild.level,
      },
      role: user.role,
    };
  }
}
