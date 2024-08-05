import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { FeedEntity } from '../feed/entities/feed.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
    @InjectRepository(FeedEntity)
    private feedRepository: Repository<FeedEntity>,
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
}
