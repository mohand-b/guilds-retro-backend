import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FeedEntity } from '../feed/entities/feed.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, FeedEntity]),
    UsersModule,
    NotificationsModule,
  ],
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService, TypeOrmModule],
})
export class EventsModule {}
