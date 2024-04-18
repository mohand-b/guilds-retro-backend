import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Event } from '../../event/entities/event.entity';
import { GuildAlliance } from '../../alliance/entities/alliance.entity';

@Entity()
export class Guild {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @OneToMany(() => User, (user) => user.guild)
  members: User[];

  @ManyToOne(() => User, (user) => user.leadGuild)
  leader: User;

  @OneToMany(() => Event, (event) => event.guild)
  events: Event[];

  @OneToMany(() => GuildAlliance, (alliance) => alliance.guild1)
  alliances: GuildAlliance[];
}
