import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { EventFeedDto } from './dto/event-feed.dto';

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const guildIds: number[] = [
      user.guild.id,
      ...user.guild.allies.map((guild) => guild.id),
    ];

    const sixMonthsAgo: Date = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.participants', 'participants')
      .leftJoinAndSelect('event.creator', 'creator')
      .leftJoinAndSelect('creator.guild', 'creatorGuild')
      .where('creatorGuild.id IN (:...guildIds)', { guildIds: [user.guild.id] })
      .orWhere(
        'event.isAccessibleToAllies = true AND creatorGuild.id IN (:...allyGuildIds)',
        { allyGuildIds: user.guild.allies.map((guild) => guild.id) },
      )
      .andWhere('event.date >= :sixMonthsAgo', { sixMonthsAgo })
      .orderBy('event.date', 'DESC')
      .getMany();
  }

  async joinEvent(eventId: number, userId: number): Promise<EventFeedDto> {
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
    const savedEvent = await this.eventsRepository.save(event);

    return {
      ...savedEvent,
      feedType: 'event',
      feedId: `event-${savedEvent.id}`,
    };
  }

  async withdrawFromEvent(
    eventId: number,
    userId: number,
  ): Promise<EventFeedDto> {
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

    event.participants = event.participants.filter(
      (participant) => participant.id !== userId,
    );
    const savedEvent = await this.eventsRepository.save(event);

    return {
      ...savedEvent,
      feedType: 'event',
      feedId: `event-${savedEvent.id}`,
    };
  }
}
