import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { UsersService } from '../users/users.service';
import { NotificationGateway } from './notification.gateway';
import { Like } from '../likes/entities/like.entity';
import { Event } from '../events/entities/event';
import { AccountLinkRequest } from '../users/entities/account-link-request.entity';
import { MembershipRequest } from '../membership-requests/entities/membership-request.entity';
import { Alliance } from '../alliances/entities/alliance.entity';
import { NotificationDto } from './dto/notification.dto';
import { CommentEntity } from '../comments/entities/comment.entity';

@Injectable()
export class NotificationsService {
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
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async createNotification(
    userIds: number[],
    type: string,
    message: string,
    likeId?: number,
    commentId?: number,
    eventId?: number,
    accountLinkRequestId?: number,
    membershipRequestId?: number,
    allianceId?: number,
    emitterId?: number,
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const userId of userIds) {
      const user = await this.usersService.findOneById(userId);
      if (!user) {
        continue;
      }

      const like = likeId
        ? await this.likeRepository.findOne({ where: { id: likeId } })
        : null;
      const comment = commentId
        ? await this.commentRepository.findOne({ where: { id: commentId } })
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
        ? await this.allianceRepository.findOne({ where: { id: allianceId } })
        : null;
      const emitter = emitterId
        ? await this.usersService.findOneById(emitterId)
        : null;

      const notification = this.notificationRepository.create({
        user,
        type,
        message,
        createdAt: new Date(),
        read: false,
        like,
        comment,
        event,
        accountLinkRequest,
        membershipRequest,
        alliance,
        emitter,
      });

      const savedNotification =
        await this.notificationRepository.save(notification);

      const fullNotification = await this.notificationRepository.findOne({
        where: { id: savedNotification.id },
        relations: [
          'user',
          'emitter',
          'like',
          'like.post',
          'comment',
          'comment.post',
          'event',
          'accountLinkRequest',
          'membershipRequest',
          'alliance',
        ],
      });

      if (fullNotification) {
        notifications.push(fullNotification);

        this.notificationGateway.notifyUser(
          userId,
          this.toNotificationDto(fullNotification),
        );
      }
    }

    return notifications;
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

  async cancelNotificationByAllianceRequest(requestId: number): Promise<void> {
    const notifications = await this.notificationRepository.find({
      where: { alliance: { id: requestId } },
      relations: ['user'],
    });

    if (notifications.length > 0) {
      notifications.forEach((notification) => {
        this.notificationGateway.cancelNotification(
          notification.user.id,
          notification.id,
        );
      });

      await this.notificationRepository.remove(notifications);
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

  async getNotificationsForUser(userId: number): Promise<NotificationDto[]> {
    const notifications = await this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      relations: [
        'user',
        'emitter',
        'like',
        'like.post',
        'comment',
        'comment.post',
        'event',
        'accountLinkRequest',
        'membershipRequest',
        'alliance',
      ],
    });

    return notifications.map((notification) =>
      this.toNotificationDto(notification),
    );
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

  toNotificationDto(notification: Notification): NotificationDto {
    return {
      id: notification.id,
      user: {
        id: notification.user.id,
        username: notification.user.username,
      },
      type: notification.type,
      message: notification.message,
      createdAt: notification.createdAt,
      read: notification.read,
      like: notification.like,
      comment: notification.comment,
      event: notification.event,
      accountLinkRequest: notification.accountLinkRequest,
      membershipRequest: notification.membershipRequest,
      alliance: notification.alliance,
      emitter: notification.emitter
        ? {
            id: notification.emitter.id,
            username: notification.emitter.username,
          }
        : undefined,
    };
  }
}
