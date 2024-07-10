import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
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

  @Column({ nullable: true })
  dungeonName?: string;

  @Column({ nullable: true })
  arenaTargets?: string;

  @CreateDateColumn()
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
}
