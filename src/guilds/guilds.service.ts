import { Injectable } from '@nestjs/common';
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

  async create(createGuildDto: CreateGuildDto, leader: User): Promise<Guild> {
    const newGuild = this.guildsRepository.create({
      ...createGuildDto,
      leader,
      members: [leader],
    });

    await this.guildsRepository.save(newGuild);
    return newGuild;
  }

  async findOne(id: number): Promise<Guild> {
    return this.guildsRepository.findOneBy({ id });
  }

  async findAll(): Promise<Guild[]> {
    return this.guildsRepository.find({
      relations: ['members', 'leader'],
    });
  }
}
