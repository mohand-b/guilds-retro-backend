import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from '../posts/entities/post.entity';
import { Comment } from './entities/comment.entity';
import { CommentDto } from './dto/comment.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaginatedCommentsDto } from './dto/paginated-comments.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

    const post = await this.postRepository.findOne({ where: { id: postId } });
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

    return commentDto;
  }

  async getPaginatedComments(
    postId: number,
    page = 1,
    limit = 3,
  ): Promise<PaginatedCommentsDto> {
    const [comments, total] = await this.commentRepository.findAndCount({
      where: { post: { id: postId } },
      relations: ['user'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const commentDtos: CommentDto[] = comments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt,
      postId: postId,
      user: comment.user,
    }));

    return {
      total,
      page,
      limit,
      comments: commentDtos,
    };
  }
}
