import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Guild } from '../../guild/entities/guild.entity';

@Entity()
export class GuildAlliance {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Guild, (guild) => guild.alliances)
  guild1: Guild;

  @ManyToOne(() => Guild, (guild) => guild.alliances)
  guild2: Guild;

  @Column()
  status: string;
}
