import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Guild } from '../../guilds/entities/guild.entity';
import { CharacterClass } from '../enum/character-class.enum';
import { Exclude } from 'class-transformer';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
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
  guild: Guild;

  @ManyToOne(() => Guild, (guild) => guild.leader)
  leadGuild: Guild;
}
