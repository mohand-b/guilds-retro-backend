import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { ReportType } from '../dto/report.dto';
import { Event } from '../../events/entities/event';
import { ReportStatusEnum } from '../enum/report-status.enum';

@Entity()
export class ReportEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.posts)
  reporter: Pick<User, 'id' | 'username'>;

  @Column({ type: 'enum', enum: ['post', 'user', 'event'] })
  reportType: ReportType;

  @Column({ type: 'text' })
  reason: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({
    type: 'enum',
    enum: ReportStatusEnum,
    default: ReportStatusEnum.PENDING,
  })
  status: ReportStatusEnum;

  @ManyToOne(() => PostEntity, { nullable: true, onDelete: 'CASCADE' })
  post?: PostEntity;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  user?: User;

  @ManyToOne(() => Event, { nullable: true, onDelete: 'CASCADE' })
  event?: Event;
}
