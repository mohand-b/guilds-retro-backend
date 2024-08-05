import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { EventsModule } from '../events/events.module';
import { FeedEntity } from './entities/feed.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeedEntity, User]), EventsModule],
  providers: [FeedService],
  controllers: [FeedController],
})
export class FeedModule {}
