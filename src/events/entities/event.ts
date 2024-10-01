import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { FeedEntity } from '../../feed/entities/feed.entity';

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column({ nullable: true })
  dungeonName?: string;

  @Column({ nullable: true })
  arenaTargets?: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamptz' })
  date: Date;

  @Column()
  maxParticipants: number;

  @Column({ nullable: true })
  minLevel?: number;

  @Column({ type: 'simple-array', nullable: true })
  requiredClasses?: string[];

  @Column({ default: false })
  requiresOptimization?: boolean;

  @ManyToOne(() => User, { eager: true })
  creator: User;

  @ManyToMany(() => User)
  @JoinTable()
  participants: User[];

  @Column({ default: false })
  isAccessibleToAllies: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToOne(() => FeedEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feedId' })
  feed: FeedEntity;

  @OneToMany(() => Notification, (notification) => notification.event)
  notifications: Notification[];
}
