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
    return this.postRepository.save(post);
  }
}
