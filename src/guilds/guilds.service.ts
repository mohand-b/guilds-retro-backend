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
    private guildsRepository: Repository<Guild>,
  ) {}

  async create(createGuildDto: CreateGuildDto, creator: User): Promise<Guild> {
    const guild = this.guildsRepository.create({
      ...createGuildDto,
      members: [creator],
    });

    await this.guildsRepository.save(guild);
    return guild;
  }

  async findOne(id: number): Promise<Guild> {
    return this.guildsRepository.findOne({
      where: { id: id },
      relations: ['allies'],
    });
  }

  async findAll(): Promise<Guild[]> {
    return this.guildsRepository.find({
      relations: ['members', 'allies'],
    });
  }

  async addAlly(guildId: number, allyGuildId: number): Promise<void> {
    const guild = await this.guildsRepository.findOne({
      where: { id: guildId },
      relations: ['allies'],
    });

    const allyGuild = await this.findOne(allyGuildId);

    if (!guild || !allyGuild) {
      throw new NotFoundException('Guild not found');
    }

    guild.allies.push(allyGuild);
    await this.guildsRepository.save(guild);
  }
}
