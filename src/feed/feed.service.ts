import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { PostEntity } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { EventsService } from '../events/events.service';
import { PostFeedDto } from '../posts/dto/post-feed.dto';
import { EventFeedDto } from '../events/dto/event-feed.dto';
import { Event } from '../events/entities/event.entity';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private eventsService: EventsService,
  ) {}

  async getFeed(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<(PostFeedDto | EventFeedDto)[]> {
    const user: User = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['guild', 'guild.allies'],
    });

    if (!user) throw new Error('User not found');

    let posts: PostEntity[];

    const guildAndAlliesIds: number[] = [
      user.guild.id,
      ...user.guild.allies.map((a) => a.id),
    ];

    if (user.feedClosingToGuildAndAllies) {
      posts = await this.postRepository.find({
        where: {
          user: {
            guild: { id: In(guildAndAlliesIds) },
          },
        },
        relations: [
          'user',
          'user.guild',
          'likes',
          'likes.user',
          'comments',
          'comments.user',
        ],
        order: { createdAt: 'DESC' },
      });
    } else {
      posts = await this.postRepository.find({
        where: [
          {
            user: {
              guild: { id: In(guildAndAlliesIds) },
            },
          },
          {
            user: {
              guild: { id: Not(In(guildAndAlliesIds)) },
              feedClosingToGuildAndAllies: false,
            },
          },
        ],
        relations: [
          'user',
          'user.guild',
          'likes',
          'likes.user',
          'comments',
          'comments.user',
        ],
        order: { createdAt: 'DESC' },
      });
    }

    const events: Event[] =
      await this.eventsService.getAccessibleEvents(userId);

    const postDtos: PostFeedDto[] = posts.map((post) => ({
      ...post,
      feedId: `post-${post.id}`,
      feedType: 'post',
    }));

    const eventDtos: EventFeedDto[] = events.map((event) => ({
      ...event,
      feedId: `event-${event.id}`,
      feedType: 'event',
    }));

    const allItems: (PostFeedDto | EventFeedDto)[] = [
      ...postDtos,
      ...eventDtos,
    ].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    const skip: number = (page - 1) * limit;

    return allItems.slice(skip, skip + limit);
  }
}
