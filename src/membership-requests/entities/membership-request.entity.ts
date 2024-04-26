import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Guild } from '../../guilds/entities/guild.entity';
import { RequestStatus } from '../enum/membership-status.enum';

@Entity()
export class MembershipRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.membershipRequests, { eager: false })
  user: User;

  @ManyToOne(() => Guild, (guild) => guild.membershipRequests, { eager: false })
  guild: Guild;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;
}
