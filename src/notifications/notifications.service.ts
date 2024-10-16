import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { NotificationGateway } from './notification.gateway';
import { Like } from '../likes/entities/like.entity';
import { Event } from '../events/entities/event';
import { AccountLinkRequest } from '../users/entities/account-link-request.entity';
import { MembershipRequest } from '../membership-requests/entities/membership-request.entity';
import { Alliance } from '../alliances/entities/alliance.entity';

@Injectable()
export class NotificationsService {
  v;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(AccountLinkRequest)
    private readonly accountLinkRequestRepository: Repository<AccountLinkRequest>,
    @InjectRepository(MembershipRequest)
    private readonly membershipRequestRepository: Repository<MembershipRequest>,
    @InjectRepository(Alliance)
    private readonly allianceRepository: Repository<Alliance>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async createNotification(
    userId: number,
    type: string,
    message: string,
    likeId?: number,
    eventId?: number,
    accountLinkRequestId?: number,
    membershipRequestId?: number,
    allianceId?: number,
  ): Promise<Notification> {
    const user: User = await this.usersService.findOneById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const like = likeId
      ? await this.likeRepository.findOne({ where: { id: likeId } })
      : null;

    const event = eventId
      ? await this.eventRepository.findOne({ where: { id: eventId } })
      : null;

    const accountLinkRequest = accountLinkRequestId
      ? await this.accountLinkRequestRepository.findOne({
          where: { id: accountLinkRequestId },
        })
      : null;

    const membershipRequest = membershipRequestId
      ? await this.membershipRequestRepository.findOne({
          where: { id: membershipRequestId },
        })
      : null;

    const alliance = allianceId
      ? await this.allianceRepository.findOne({
          where: { id: allianceId },
        })
      : null;

    const notification: Notification = this.notificationRepository.create({
      user,
      type,
      message,
      createdAt: new Date(),
      read: false,
      like,
      event,
      accountLinkRequest,
      membershipRequest,
      alliance,
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

  async cancelNotificationByEvent(eventId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { event: { id: eventId } },
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

  async cancelNotificationByLinkRequest(requestId: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { accountLinkRequest: { id: requestId } },
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

  async cancelNotificationByMembershipRequest(
    requestId: number,
  ): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { membershipRequest: { id: requestId } },
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
      relations: ['like', 'event', 'accountLinkRequest', 'membershipRequest'],
    });
  }

  async markNotificationsAsRead(
    notificationIds: number[],
  ): Promise<Notification[]> {
    const notifications = await this.notificationRepository.findBy({
      id: In(notificationIds),
    });

    if (!notifications.length) {
      throw new Error('Notifications not found');
    }

    const updatedNotifications = notifications.map((notification) => {
      if (!notification.read) {
        notification.read = true;
      }
      return notification;
    });

    return this.notificationRepository.save(updatedNotifications);
  }
}
