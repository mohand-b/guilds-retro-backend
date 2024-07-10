import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { JoinEventDto } from './dto/join-event.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    private usersService: UsersService,
  ) {}

  async createEvent(
    createEventDto: CreateEventDto,
    creatorId: number,
  ): Promise<Event> {
    const creator: User = await this.usersService.findOneById(creatorId);
    if (!creator) {
      throw new NotFoundException('User not found');
    }

    const event: Event = this.eventsRepository.create({
      ...createEventDto,
      creator,
      participants: [creator],
    });

    return this.eventsRepository.save(event);
  }

  async getEvents(): Promise<Event[]> {
    return this.eventsRepository.find({
      relations: ['participants', 'creator'],
    });
  }

  async getAccessibleEvents(userId: number): Promise<Event[]> {
    const user = await this.usersService.findOneById(userId, {
      relations: ['guild', 'guild.allies'],
    });

    if (!user || !user.guild) {
      throw new NotFoundException(
        'User not found or user does not belong to any guild',
      );
    }

    const guildIds: number[] = [
      user.guild.id,
      ...user.guild.allies.map((guild) => guild.id),
    ];

    return this.eventsRepository.find({
      where: [
        { creator: { guild: { id: In(guildIds) } } },
        {
          isAccessibleToAllies: true,
          creator: {
            guild: { id: In(user.guild.allies.map((guild) => guild.id)) },
          },
        },
      ],
      relations: ['participants', 'creator'],
    });
  }

  async joinEvent(joinEventDto: JoinEventDto): Promise<Event> {
    const { userId, eventId } = joinEventDto;

    const event: Event = await this.eventsRepository.findOne({
      where: { id: eventId },
      relations: ['participants'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const user: User = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (event.participants.length >= event.maxParticipants) {
      throw new Error('Event is already full');
    }

    event.participants.push(user);
    return this.eventsRepository.save(event);
  }
}
