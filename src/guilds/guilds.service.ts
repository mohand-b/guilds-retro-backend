import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Guild } from './entities/guild.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGuildDto } from './dto/create-guild.dto';
import { User } from '../users/entities/user.entity';
import { LightGuildDto } from './dto/guild.dto';
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
    const guild = this.guildRepository.create({
      ...createGuildDto,
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

  async findAllRecruitingGuilds(): Promise<LightGuildDto[]> {
    const guilds: LightGuildDto[] = await this.guildRepository
      .createQueryBuilder('guild')
      .leftJoinAndSelect('guild.members', 'member')
      .leftJoin('guild.members', 'leader', 'leader.role = :leaderRole', {
        leaderRole: UserRole.LEADER,
      })
      .leftJoinAndSelect('guild.allies', 'ally')
      .select([
        'guild.id',
        'guild.name',
        'guild.description',
        'leader.username AS leaderUsername',
        'count(member.id) AS nbOfMembers',
        'count(ally.id) AS nbOfAllies',
      ])
      .groupBy('guild.id')
      .addGroupBy('leader.username')
      .having('count(member.id) < guild.capacity')
      .andHaving('guild.isRecruiting = :isRecruiting', { isRecruiting: true })
      .getRawMany();

    return guilds.map((guild) => ({
      id: guild.id,
      name: guild.name,
      description: guild.description || '',
      nbOfMembers: guild.nbOfMembers || 0,
      nbOfAllies: guild.nbOfAllies || 0,
      leaderUsername: guild.leaderUsername || 'N/A',
    }));
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
