import { Controller, Get, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  @Get(':userId')
  getNotifications(@Param('userId') userId: number) {
    return this.notificationService.getNotificationsForUser(userId);
  }
}
