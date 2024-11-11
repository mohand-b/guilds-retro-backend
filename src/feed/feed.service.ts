import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { FeedEntity } from './entities/feed.entity';
import { FeedDto } from './dto/feed.dto';
import { CommentEntity } from '../comments/entities/comment.entity';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(FeedEntity)
    private feedRepository: Repository<FeedEntity>,
    @InjectRepository(CommentEntity)
    private commentRepository: Repository<CommentEntity>,
  ) {}

  async getFeed(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    total: number;
    page: number;
    limit: number;
    data: FeedDto[];
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['guild', 'guild.allies'],
    });

    if (!user || !user.guild) {
      throw new Error('User not found or user does not belong to any guild');
    }

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

    const postIds = paginatedResults
      .filter((feed) => feed.post)
      .map((feed) => feed.post.id);

    let commentCountMap: Record<number, number> = {};

    if (postIds.length > 0) {
      const commentCounts = await this.commentRepository
        .createQueryBuilder('comment')
        .select('comment.postId', 'postId')
        .addSelect('COUNT(comment.id)', 'count')
        .where('comment.postId IN (:...postIds)', { postIds })
        .groupBy('comment.postId')
        .getRawMany();

      commentCountMap = commentCounts.reduce(
        (acc, { postId, count }) => {
          acc[postId] = parseInt(count, 10);
          return acc;
        },
        {} as Record<number, number>,
      );
    }

    const feedDtos: FeedDto[] = paginatedResults.map((feedEntity) => {
      const feedDto: FeedDto = {
        id: feedEntity.id,
        createdAt: feedEntity.createdAt,
      };

      if (feedEntity.post) {
        const commentCount = commentCountMap[feedEntity.post.id] || 0;

        feedDto.post = {
          id: feedEntity.post.id,
          text: feedEntity.post.text,
          user: feedEntity.post.user,
          createdAt: feedEntity.post.createdAt,
          updatedAt: feedEntity.post.updatedAt,
          image: feedEntity.post.image,
          likes: feedEntity.post.likes,
          commentCount,
        };
      }

      if (feedEntity.event) {
        feedDto.event = {
          id: feedEntity.event.id,
          type: feedEntity.event.type,
          title: feedEntity.event.title,
          date: feedEntity.event.date,
          dungeonName: feedEntity.event.dungeonName,
          arenaTargets: feedEntity.event.arenaTargets,
          image: feedEntity.event.image,
          description: feedEntity.event.description,
          maxParticipants: feedEntity.event.maxParticipants,
          minLevel: feedEntity.event.minLevel,
          requiredClasses: feedEntity.event.requiredClasses,
          requiresOptimization: feedEntity.event.requiresOptimization,
          creator: feedEntity.event.creator,
          participants: feedEntity.event.participants,
          isAccessibleToAllies: feedEntity.event.isAccessibleToAllies,
          createdAt: feedEntity.event.createdAt,
        };
      }

      return feedDto;
    });

    return {
      total,
      page,
      limit,
      data: feedDtos,
    };
  }
}
