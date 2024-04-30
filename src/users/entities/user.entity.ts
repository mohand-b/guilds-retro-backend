import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Guild } from '../../guilds/entities/guild.entity';
import { CharacterClass } from '../enum/character-class.enum';
import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../enum/user-role.enum';
import { MembershipRequest } from '../../membership-requests/entities/membership-request.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: CharacterClass,
  })
  characterClass: CharacterClass;

  @ManyToOne(() => Guild, (guild) => guild.members, { eager: true })
  @Exclude()
  guild: Guild;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CANDIDATE,
  })
  @Expose()
  role: UserRole;

  @OneToMany(
    () => MembershipRequest,
    (membershipRequest) => membershipRequest.user,
  )
  membershipRequests: MembershipRequest[];
}
