import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Guild } from '../../guild/entities/guild.entity';
import { User } from '../../user/entities/user.entity';

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

  @ManyToOne(() => Guild, (guild) => guild.events)
  guild: Guild;

  @ManyToOne(() => User, (user) => user.eventsOrganized)
  organizer: User;

  @ManyToMany(() => User)
  @JoinTable()
  participants: User[];

  @Column({ default: false })
  isAccessibleToAllies: boolean;
}
