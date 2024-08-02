import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enum/user-role.enum';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  getNotifications(@Req() req: any): Promise<Notification[]> {
    return this.notificationsService.getNotificationsForUser(req.user.userId);
  }

  @Patch('mark-as-read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  async markNotificationsAsRead(
    @Body('notificationIds') notificationIds: number[],
  ): Promise<Notification[]> {
    return this.notificationsService.markNotificationsAsRead(notificationIds);
  }
}
