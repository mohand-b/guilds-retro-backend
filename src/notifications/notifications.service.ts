import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly usersService: UsersService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async createNotification(
    userId: number,
    type: string,
    message: string,
  ): Promise<Notification> {
    const user: User = await this.usersService.findOneById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const notification: Notification = this.notificationRepository.create({
      user,
      type,
      message,
      createdAt: new Date(),
      read: false,
    });

    const savedNotification: Notification =
      await this.notificationRepository.save(notification);

    this.notificationGateway.notifyUser(userId, savedNotification);

    return savedNotification;
  }

  async getNotificationsForUser(userId: number) {
    return this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }
}
