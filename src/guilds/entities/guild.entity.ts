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
import { MembershipRequest } from '../../membership-requests/entities/membership-request.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class Guild {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  level: number;

  @OneToMany(() => User, (user) => user.guild)
  members: User[];

  @OneToMany(() => Alliance, (alliance) => alliance.requesterGuild)
  allianceRequests: Alliance[];

  @OneToMany(() => Alliance, (alliance) => alliance.targetGuild)
  receivedRequests: Alliance[];

  @ManyToMany(() => Guild)
  @JoinTable()
  allies: Guild[];

  @OneToMany(
    () => MembershipRequest,
    (membershipRequest) => membershipRequest.guild,
  )
  @Exclude()
  membershipRequests: MembershipRequest[];

  @Column({ default: 100 })
  capacity: number;

  @Column({ default: true })
  isRecruiting: boolean;

  @Column({ type: 'bytea', nullable: true })
  logo: Buffer;
}
