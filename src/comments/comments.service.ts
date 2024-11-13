import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from '../posts/entities/post.entity';
import { CommentEntity } from './entities/comment.entity';
import { CommentDto } from './dto/comment.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaginatedCommentsDto } from './dto/paginated-comments.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { AppRank } from '../users/enum/app-rank.enum';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private commentRepository: Repository<CommentEntity>,
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    createCommentDto: CreateCommentDto,
    userId: number,
  ): Promise<CommentDto> {
    const { postId, text } = createCommentDto;
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['user'],
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const newComment = this.commentRepository.create({
      text,
      user,
      post,
    });

    const savedComment = await this.commentRepository.save(newComment);

    const commentDto: CommentDto = {
      id: savedComment.id,
      text: savedComment.text,
      createdAt: savedComment.createdAt,
      postId: post.id,
      user: user,
    };

    if (user.id !== post.user.id) {
      await this.notificationsService.createNotification(
        [post.user.id],
        'comment',
        `${user.username} a commenté ton post`,
        undefined,
        savedComment.id,
        undefined,
        undefined,
        undefined,
        undefined,
        userId,
      );
    }

    return commentDto;
  }

  async getPaginatedComments(
    postId: number,
    cursor?: number,
    limit = 3,
  ): Promise<PaginatedCommentsDto> {
    const allComments = await this.commentRepository.find({
      where: { post: { id: postId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const paginatedComments = cursor
      ? allComments.filter((comment) => comment.id < cursor).slice(0, limit)
      : allComments.slice(0, limit);

    const newCursor =
      paginatedComments.length > 0
        ? paginatedComments[paginatedComments.length - 1].id
        : null;

    const commentDtos: CommentDto[] = paginatedComments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt,
      postId: postId,
      user: comment.user,
    }));

    return {
      total: allComments.length,
      page: cursor ? Math.ceil(allComments.length / limit) : 1,
      limit,
      comments: commentDtos,
      cursor: newCursor,
    };
  }

  async delete(
    commentId: number,
    userId: number,
    userRank: AppRank,
  ): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'post'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (
      comment.user.id !== userId &&
      ![AppRank.MODERATOR, AppRank.ADMIN].includes(userRank)
    ) {
      throw new UnauthorizedException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);
  }
}
