import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  type: string;

  @CreateDateColumn()
  date: Date;

  @ManyToMany(() => User)
  @JoinTable()
  participants: User[];

  @Column({ default: false })
  isAccessibleToAllies: boolean;
}
