import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { Repository } from 'typeorm';
import { PostFeedDto } from './dto/post-feed.dto';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
  ) {}

  async create(
    createPostDto: CreatePostDto,
    userId: number,
  ): Promise<PostFeedDto> {
    const post = this.postRepository.create({
      ...createPostDto,
      user: { id: userId } as any,
    });

    const savedPost = await this.postRepository.save(post);

    const completePost = await this.postRepository.findOne({
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

    return this.toPostFeedDto(completePost);
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

  private toPostFeedDto(post: PostEntity): PostFeedDto {
    return {
      feedId: `post-${post.id}`,
      id: post.id,
      text: post.text,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      image: post.image,
      feedType: 'post',
      user: post.user,
      comments: post.comments,
      likes: post.likes,
    };
  }
}
