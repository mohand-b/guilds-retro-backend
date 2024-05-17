import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Guild } from './entities/guild.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGuildDto } from './dto/create-guild.dto';
import { User } from '../users/entities/user.entity';
import { LightGuildDto } from './dto/guild.dto';
import { convertBufferToBase64 } from '../common/utils/image.utils';
import { UserRole } from '../users/enum/user-role.enum';

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

  async findCurrentGuild(userId: number): Promise<Guild> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['guild'],
    });

    if (!user || !user.guild) {
      throw new NotFoundException(
        'User not found or user is not part of any guild',
      );
    }

    return this.guildRepository.findOne({
      where: { id: user.guild.id },
      relations: ['members', 'allies'],
    });
  }

  async findAll(): Promise<Guild[]> {
    return this.guildRepository.find({
      relations: ['members', 'allies'],
    });
  }

  async findRecruitingGuilds(): Promise<LightGuildDto[]> {
    const guilds = await this.guildRepository.find({
      where: { isRecruiting: true },
      relations: ['members', 'allies'],
    });

    return guilds
      .filter((guild) => guild.members.length <= guild.capacity)
      .map((guild) => this.toLightGuildDto(guild));
  }

  private toLightGuildDto(guild: Guild): LightGuildDto {
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
      logo: convertBufferToBase64(guild.logo),
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
}
