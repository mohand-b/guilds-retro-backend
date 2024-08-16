import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Guild } from '../../guilds/entities/guild.entity';
import { RequestStatus } from '../enum/request-status.enum';
import { Notification } from '../../notifications/entities/notification.entity';

@Entity()
export class MembershipRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.membershipRequests, { eager: false })
  user: User;

  @ManyToOne(() => Guild, (guild) => guild.membershipRequests, { eager: false })
  guild: Guild;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @CreateDateColumn()
  createdAt: Date;

  @CreateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Notification, (notification) => notification.like, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  notifications: Notification[];
}
