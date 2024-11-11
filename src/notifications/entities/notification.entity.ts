import { Like } from 'src/likes/entities/like.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Event } from '../../events/entities/event';
import { AccountLinkRequest } from '../../users/entities/account-link-request.entity';
import { MembershipRequest } from '../../membership-requests/entities/membership-request.entity';
import { Alliance } from '../../alliances/entities/alliance.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.notifications, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'emitterId' })
  emitter?: User;

  @Column()
  type: string;

  @Column()
  message: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ default: false })
  read: boolean;

  @ManyToOne(() => Like, { nullable: true, onDelete: 'CASCADE' })
  like?: Like;

  @ManyToOne(() => CommentEntity, { nullable: true, onDelete: 'CASCADE' })
  comment?: CommentEntity;

  @ManyToOne(() => Event, { nullable: true, onDelete: 'CASCADE' })
  event?: Event;

  @ManyToOne(() => AccountLinkRequest, { nullable: true, onDelete: 'CASCADE' })
  accountLinkRequest?: AccountLinkRequest;

  @ManyToOne(() => MembershipRequest, { nullable: true, onDelete: 'CASCADE' })
  membershipRequest?: MembershipRequest;

  @ManyToOne(() => Alliance, { nullable: true, onDelete: 'CASCADE' })
  alliance?: Alliance;
}
