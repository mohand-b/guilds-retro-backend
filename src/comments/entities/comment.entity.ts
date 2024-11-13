import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { ReportEntity } from '../../reports/entities/report.entity';

@Entity()
export class CommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  text: string;

  @ManyToOne(() => User, (user) => user.comments)
  user: User;

  @ManyToOne(() => PostEntity, (post) => post.comments, { onDelete: 'CASCADE' })
  post: PostEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Notification, (notification) => notification.like, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  notifications: Notification[];

  @OneToMany(() => ReportEntity, (report) => report.post, { eager: false })
  reports: ReportEntity[];
}
