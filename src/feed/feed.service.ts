import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from '../posts/entities/post.entity';
import { In, Not, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getFeed(userId: number): Promise<PostEntity[]> {
    const user = await this.userRepository.findOne({
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
        relations: ['user', 'user.guild', 'likes', 'comments'],
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
        relations: ['user', 'user.guild', 'likes', 'comments'],
        order: { createdAt: 'DESC' },
      });
    }

    return posts;
  }
}
