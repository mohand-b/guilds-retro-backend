import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Guild } from '../../guilds/entities/guild.entity';

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
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING',
  })
  status: string;
}
