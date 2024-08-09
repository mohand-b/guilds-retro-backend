import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { FeedEntity } from './entities/feed.entity';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(FeedEntity)
    private feedRepository: Repository<FeedEntity>,
  ) {}

  async getFeed(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    total: number;
    page: number;
    limit: number;
    data: FeedEntity[];
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['guild', 'guild.allies'],
    });

    if (!user || !user.guild)
      throw new Error('User not found or user does not belong to any guild');

    const guildIds: number[] = [
      user.guild.id,
      ...user.guild.allies.map((guild) => guild.id),
    ];

    let query = this.feedRepository
      .createQueryBuilder('feed')
      .leftJoinAndSelect('feed.post', 'post')
      .leftJoinAndSelect('feed.event', 'event')
      .leftJoinAndSelect('post.user', 'postUser')
      .leftJoinAndSelect('postUser.guild', 'postUserGuild')
      .leftJoinAndSelect('post.likes', 'likes')
      .leftJoinAndSelect('likes.user', 'likeUser')
      .leftJoinAndSelect('event.creator', 'eventCreator')
      .leftJoinAndSelect('event.participants', 'participants')
      .leftJoinAndSelect('eventCreator.guild', 'eventCreatorGuild')
      .orderBy('feed.createdAt', 'DESC');

    if (user.feedClosingToGuildAndAllies) {
      query = query.where('postUserGuild.id IN (:...guildIds)', { guildIds });
    } else {
      query = query.where(
        '(postUserGuild.id IN (:...guildIds) OR ' +
          '(postUserGuild.id NOT IN (:...guildIds) AND postUser.feedClosingToGuildAndAllies = false))',
        { guildIds },
      );
    }

    query = query.orWhere(
      '(eventCreatorGuild.id IN (:...guildIds) AND event.isAccessibleToAllies = true) ' +
        'OR (eventCreatorGuild.id = :userGuildId)',
      { guildIds, userGuildId: user.guild.id },
    );

    const [allResults, total] = await query.getManyAndCount();

    const paginatedResults: FeedEntity[] = allResults.slice(
      (page - 1) * limit,
      page * limit,
    );

    return {
      total,
      page,
      limit,
      data: paginatedResults,
    };
  }
}
