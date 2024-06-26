import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
  ) {}

  async create(createPostDto: CreatePostDto, userId): Promise<PostEntity> {
    const post = this.postRepository.create({
      ...createPostDto,
      user: { id: userId } as any,
    });

    const savedPost = await this.postRepository.save(post);

    return this.postRepository.findOne({
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
