import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Guild } from './entities/guild.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGuildDto } from './dto/create-guild.dto';
import { User } from '../users/entities/user.entity';

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
      throw new Error('User not found or user is not part of any guild');
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
