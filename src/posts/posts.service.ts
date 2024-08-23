import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { FeedEntity } from '../feed/entities/feed.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
    @InjectRepository(FeedEntity)
    private feedRepository: Repository<FeedEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    createPostDto: CreatePostDto,
    userId: number,
  ): Promise<FeedEntity> {
    const post: PostEntity = this.postRepository.create({
      ...createPostDto,
      user: { id: userId } as any,
    });

    const savedPost: PostEntity = await this.postRepository.save(post);

    const completePost: PostEntity = await this.postRepository.findOne({
      where: { id: savedPost.id },
      relations: [
        'user',
        'user.guild',
        'likes',
        'likes.user',
        'comments',
        'comments.user',
      ],
    });

    if (completePost) {
      const feedEntry: FeedEntity = this.feedRepository.create({
        post: completePost,
        createdAt: new Date(),
      });
      return this.feedRepository.save(feedEntry);
    }

    throw new Error('Post creation failed');
  }

  async delete(id: number): Promise<void> {
    await this.postRepository.delete(id);
  }

  async findOneById(id: number): Promise<PostEntity> {
    return await this.postRepository.findOne({
      where: { id },
      relations: ['user', 'likes', 'comments', 'likes.user', 'comments.user'],
    });
  }

  async findLastFivePostsByUser(
    targetUserId: number,
    requestingUserId: number,
  ): Promise<PostEntity[]> {
    if (targetUserId === requestingUserId) {
      return this.postRepository.find({
        where: { user: { id: targetUserId } },
        order: { createdAt: 'DESC' },
        take: 5,
      });
    }

    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
      relations: ['guild', 'guild.allies'],
    });

    const requestingUser = await this.userRepository.findOne({
      where: { id: requestingUserId },
      relations: ['guild', 'guild.allies'],
    });

    if (!targetUser || !requestingUser) {
      throw new Error('User not found');
    }

    if (
      targetUser.feedClosingToGuildAndAllies &&
      !this.isUserInSameGuildOrAllies(targetUser, requestingUser)
    ) {
      return [];
    }

    return this.postRepository.find({
      where: { user: { id: targetUserId } },
      order: { createdAt: 'DESC' },
      take: 5,
    });
  }

  private isUserInSameGuildOrAllies(
    targetUser: User,
    requestingUser: User,
  ): boolean {
    if (targetUser.guild.id === requestingUser.guild.id) {
      return true;
    }

    const targetGuildAllies = targetUser.guild.allies.map((ally) => ally.id);
    const requestingGuildAllies = requestingUser.guild.allies.map(
      (ally) => ally.id,
    );

    return (
      targetGuildAllies.includes(requestingUser.guild.id) ||
      requestingGuildAllies.includes(targetUser.guild.id)
    );
  }
}
