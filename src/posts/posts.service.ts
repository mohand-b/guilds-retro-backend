import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { FeedEntity } from '../feed/entities/feed.entity';
import { User } from '../users/entities/user.entity';
import { Comment } from '../comments/entities/comment.entity';
import { PostDto } from './dto/post.dto';
import { Like } from '../likes/entities/like.entity';
import { FeedDto } from '../feed/dto/feed.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
    @InjectRepository(FeedEntity)
    private feedRepository: Repository<FeedEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async create(createPostDto: CreatePostDto, userId: number): Promise<FeedDto> {
    const post: PostEntity = this.postRepository.create({
      ...createPostDto,
      user: { id: userId } as any,
    });

    const savedPost: PostEntity = await this.postRepository.save(post);

    const completePost: PostEntity = await this.postRepository.findOne({
      where: { id: savedPost.id },
      relations: ['user', 'user.guild', 'likes', 'likes.user'],
    });

    if (!completePost) {
      throw new Error('Post creation failed');
    }

    const commentCount = await this.commentRepository.count({
      where: { post: savedPost },
    });

    const feedEntry: FeedEntity = this.feedRepository.create({
      post: completePost,
      createdAt: new Date(),
    });

    const savedFeed = await this.feedRepository.save(feedEntry);

    const postDto: PostDto = {
      id: completePost.id,
      text: completePost.text,
      user: {
        id: completePost.user.id,
        username: completePost.user.username,
        characterClass: completePost.user.characterClass,
        gender: completePost.user.gender,
        guild: completePost.user.guild,
      },
      createdAt: completePost.createdAt,
      updatedAt: completePost.updatedAt,
      image: completePost.image,
      likes: completePost.likes.map(
        (like) =>
          ({
            id: like.id,
            user: {
              id: like.user.id,
              username: like.user.username,
            },
          }) as Partial<Like>,
      ),
      commentCount,
    };

    return {
      id: savedFeed.id,
      post: postDto,
      createdAt: savedFeed.createdAt,
    };
  }

  async delete(id: number): Promise<void> {
    await this.postRepository.delete(id);
  }

  async findOneById(id: number): Promise<PostDto> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['user', 'user.guild', 'likes', 'likes.user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const commentCount = await this.commentRepository.count({
      where: { post: { id: post.id } },
    });

    return {
      id: post.id,
      text: post.text,
      user: {
        id: post.user.id,
        username: post.user.username,
        characterClass: post.user.characterClass,
        gender: post.user.gender,
        guild: post.user.guild,
        role: post.user.role,
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      image: post.image,
      likes: post.likes.map(
        (like) =>
          ({
            id: like.id,
            user: {
              id: like.user.id,
              username: like.user.username,
            },
          }) as Partial<Like>,
      ),
      commentCount,
    };
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
