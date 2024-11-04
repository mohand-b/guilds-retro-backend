import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Event } from './entities/event';
import { CreateEventDto } from './dto/create-event.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { EventFeedDto } from './dto/event-feed.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { FeedEntity } from '../feed/entities/feed.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @InjectRepository(FeedEntity)
    private feedRepository: Repository<FeedEntity>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  async createEvent(
    createEventDto: CreateEventDto,
    creatorId: number,
  ): Promise<Event> {
    const creator = await this.usersService.findOneById(creatorId);
    if (!creator) {
      throw new NotFoundException('User not found');
    }

    const event = this.eventsRepository.create({
      ...createEventDto,
      creator,
      participants: [creator],
    });

    const savedEvent = await this.eventsRepository.save(event);

    const completeEvent = await this.eventsRepository.findOne({
      where: { id: savedEvent.id },
      relations: ['creator', 'participants'],
    });

    if (completeEvent) {
      console.log('Event created:', completeEvent);
      const feedEntry = this.feedRepository.create({
        event: completeEvent,
        createdAt: new Date(),
      });
      await this.feedRepository.save(feedEntry);
    }

    return completeEvent;
  }

  async getEvents(): Promise<Event[]> {
    return this.eventsRepository.find({
      relations: ['participants', 'creator'],
    });
  }

  async getAccessibleEvents(
    userId: number,
    skip?: number,
    take?: number,
  ): Promise<Event[]> {
    const user = await this.usersService.findOneById(userId, {
      relations: ['guild', 'guild.allies'],
    });

    if (!user || !user.guild) {
      throw new NotFoundException(
        'User not found or user does not belong to any guild',
      );
    }

    const guildIds: number[] = [user.guild.id];
    const allyGuildIds: number[] = user.guild.allies.map((guild) => guild.id);

    const sixMonthsAgo: Date = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const query = this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.participants', 'participants')
      .leftJoinAndSelect('event.creator', 'creator')
      .leftJoinAndSelect('creator.guild', 'creatorGuild')
      .where('creatorGuild.id IN (:...guildIds)', { guildIds });

    if (allyGuildIds.length > 0) {
      query.orWhere(
        'event.isAccessibleToAllies = true AND creatorGuild.id IN (:...allyGuildIds)',
        { allyGuildIds },
      );
    }

    query
      .andWhere('event.date >= :sixMonthsAgo', { sixMonthsAgo })
      .orderBy('event.date', 'DESC');

    if (skip !== undefined && take !== undefined) {
      query.skip(skip).take(take);
    }

    return query.getMany();
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

    await this.notificationsService.createNotification(
      savedEvent.creator.id,
      'event',
      `${user.username} a rejoint ton événement`,
      undefined,
      savedEvent.id,
    );

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

    await this.notificationsService.cancelNotificationByEvent(savedEvent.id);

    return {
      ...savedEvent,
      feedType: 'event',
      feedId: `event-${savedEvent.id}`,
    };
  }

  async getEventById(eventId: number, userId: number): Promise<Event> {
    const user = await this.usersService.findOneById(userId, {
      relations: ['guild', 'guild.allies'],
    });

    if (!user || !user.guild) {
      throw new NotFoundException(
        'User not found or user does not belong to any guild',
      );
    }

    const guildIds: number[] = [user.guild.id];
    const allyGuildIds: number[] = user.guild.allies.map((guild) => guild.id);

    const query = this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.participants', 'participants')
      .leftJoinAndSelect('event.creator', 'creator')
      .leftJoinAndSelect('creator.guild', 'creatorGuild')
      .leftJoinAndSelect('creatorGuild.allies', 'allyGuild')
      .where('event.id = :eventId', { eventId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('creatorGuild.id IN (:...guildIds)', { guildIds }).orWhere(
            'event.isAccessibleToAllies = true AND creatorGuild.id IN (:...allyGuildIds)',
            { allyGuildIds },
          );
        }),
      );

    const event = await query.getOne();

    if (!event) {
      throw new NotFoundException('Event not found or not accessible');
    }

    return event;
  }
}
