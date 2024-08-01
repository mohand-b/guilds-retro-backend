import { Like } from 'src/likes/entities/like.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

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

  @ManyToOne(() => Like, (like) => like.notifications, { nullable: true })
  like?: Like;
}
