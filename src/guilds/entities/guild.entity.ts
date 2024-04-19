import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Alliance } from '../../alliances/entities/alliance.entity';

@Entity()
export class Guild {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => User, (user) => user.guild)
  members: User[];

  @OneToMany(() => Alliance, (alliance) => alliance.requesterGuild)
  allianceRequests: Alliance[];

  @OneToMany(() => Alliance, (alliance) => alliance.targetGuild)
  receivedRequests: Alliance[];

  @ManyToMany(() => Guild)
  @JoinTable()
  allies: Guild[];
}
