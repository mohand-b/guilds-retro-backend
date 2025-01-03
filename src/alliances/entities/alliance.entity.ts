import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Guild } from '../../guilds/entities/guild.entity';
import { AllianceStatusEnum } from '../enum/alliance-status.enum';
import { Notification } from '../../notifications/entities/notification.entity';

@Entity()
export class Alliance {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Guild, (guild) => guild.allianceRequests)
  requesterGuild: Guild;

  @ManyToOne(() => Guild, (guild) => guild.receivedRequests)
  targetGuild: Guild;

  @Column({
    type: 'enum',
    enum: AllianceStatusEnum,
    default: AllianceStatusEnum.PENDING,
  })
  status: string;

  @OneToMany(() => Notification, (notification) => notification.alliance, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  notifications: Notification[];
}
