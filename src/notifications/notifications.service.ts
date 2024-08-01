import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { NotificationGateway } from './notification.gateway';
import { Like } from '../likes/entities/like.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    private readonly usersService: UsersService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async createNotification(
    userId: number,
    type: string,
    message: string,
    likeId?: number,
  ): Promise<Notification> {
    const user: User = await this.usersService.findOneById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const like = likeId
      ? await this.likeRepository.findOne({ where: { id: likeId } })
      : null;

    const notification: Notification = this.notificationRepository.create({
      user,
      type,
      message,
      createdAt: new Date(),
      read: false,
      like,
    });

    const savedNotification: Notification =
      await this.notificationRepository.save(notification);

    this.notificationGateway.notifyUser(userId, savedNotification);

    return savedNotification;
  }

  async cancelNotificationByLike(likeId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { like: { id: likeId } },
      relations: ['user'],
    });

    if (notification) {
      const notificationId = notification.id;
      await this.notificationRepository.remove(notification);
      this.notificationGateway.cancelNotification(
        notification.user.id,
        notificationId,
      );
    }
  }

  async getNotificationsForUser(userId: number) {
    return this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }
}
