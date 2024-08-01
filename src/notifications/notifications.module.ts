import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Notification } from './entities/notification.entity';
import { NotificationGateway } from './notification.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Like } from '../likes/entities/like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, Like]), UsersModule],
  providers: [NotificationsService, NotificationGateway],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
