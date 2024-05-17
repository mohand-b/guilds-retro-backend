import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity, User])],
  providers: [FeedService],
  controllers: [FeedController],
})
export class FeedModule {}
