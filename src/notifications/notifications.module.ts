import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Notification } from './entities/notification.entity';
import { NotificationGateway } from './notification.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Like } from '../likes/entities/like.entity';
import { Event } from '../events/entities/event.entity';
import { AccountLinkRequest } from '../users/entities/account-link-request.entity';
import { MembershipRequest } from '../membership-requests/entities/membership-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      Like,
      Event,
      AccountLinkRequest,
      MembershipRequest,
    ]),
    forwardRef(() => UsersModule),
  ],
  providers: [NotificationsService, NotificationGateway],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
