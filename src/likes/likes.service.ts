import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PostEntity } from '../posts/entities/post.entity';

@Injectable()
export class LikesService {
  constructor(
    private usersService: UsersService,
    private postsService: PostsService,
    private notificationsService: NotificationsService,
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
  ) {}

  async likePost(userId: number, postId: number): Promise<Like> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const post = await this.postsService.findOneById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.likeRepository.findOne({
      where: {
        user: { id: userId },
        post: { id: postId },
      },
    });

    if (existingLike) {
      throw new ConflictException('You have already liked this post');
    }

    const like = this.likeRepository.create({ user, post });

    const savedLike = await this.likeRepository.save(like);

    if (post.user.id !== userId) {
      await this.notificationsService.createNotification(
        [post.user.id],
        'like',
        `Ton post a été liké par ${user.username}`,
        savedLike.id,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        userId,
      );
    }

    return savedLike;
  }

  async unlikePost(userId: number, postId: number): Promise<void> {
    const like = await this.likeRepository.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    await this.notificationsService.cancelNotificationByLike(like.id);
    await this.likeRepository.remove(like);
  }

  async getLikesByPost(postId: number): Promise<Like[]> {
    const postEntity = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!postEntity) {
      throw new NotFoundException('Post not found');
    }

    return this.likeRepository.find({ where: { post: postEntity } });
  }
}
