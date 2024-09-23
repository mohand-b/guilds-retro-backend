import { Like } from 'src/likes/entities/like.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Event } from '../../events/entities/event';
import { AccountLinkRequest } from '../../users/entities/account-link-request.entity';
import { MembershipRequest } from '../../membership-requests/entities/membership-request.entity';
import { Alliance } from '../../alliances/entities/alliance.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.notifications)
  user: User;

  @Column()
  type: string;

  @Column()
  message: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  read: boolean;

  @ManyToOne(() => Like, (like) => like.notifications, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  like?: Like;

  @ManyToOne(() => Event, (event) => event.notifications, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  event?: Event;

  @ManyToOne(
    () => AccountLinkRequest,
    (accountLinkRequest) => accountLinkRequest.notifications,
    {
      nullable: true,
      onDelete: 'CASCADE',
    },
  )
  accountLinkRequest?: AccountLinkRequest;

  @ManyToOne(
    () => MembershipRequest,
    (membershipRequest) => membershipRequest.notifications,
    {
      nullable: true,
      onDelete: 'CASCADE',
    },
  )
  membershipRequest?: MembershipRequest;

  @ManyToOne(() => Alliance, (alliance) => alliance.notifications, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  alliance?: Alliance;
}
