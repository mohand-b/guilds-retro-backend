import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Notification } from '../../notifications/entities/notification.entity';

@Entity()
export class AccountLinkRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.sentLinkRequests)
  requester: User;

  @ManyToOne(() => User, (user) => user.receivedLinkRequests)
  targetUser: User;

  @Column()
  createdAt: Date;

  @Column({ default: false })
  isAccepted: boolean;

  @Column()
  expiresAt: Date;

  @OneToMany(
    () => Notification,
    (notification) => notification.accountLikeRequest,
    {
      cascade: true,
      onDelete: 'CASCADE',
    },
  )
  notifications: Notification[];
}
