import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Guild } from '../../guild/entities/guild.entity';
import { Event } from '../../event/entities/event.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => Guild, (guild) => guild.members)
  guild: Guild;

  @OneToMany(() => Event, (event) => event.organizer)
  eventsOrganized: Event[];

  @ManyToOne(() => Guild, (guild) => guild.leader)
  leadGuild: Guild;
}
