import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { FeedEntity } from '../feed/entities/feed.entity';
import { User } from '../users/entities/user.entity';
import { CommentEntity } from '../comments/entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity, FeedEntity, User, CommentEntity]),
  ],
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}
