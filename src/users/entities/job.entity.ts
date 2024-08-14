import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  level: number;

  @Column({ default: false })
  isForgemaging: boolean;

  @ManyToOne(() => User, (user) => user.jobs)
  user: User;
}
