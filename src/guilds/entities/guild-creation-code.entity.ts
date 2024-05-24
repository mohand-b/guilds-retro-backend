import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class GuildCreationCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  guildName: string;

  @Column({ default: true })
  isValid: boolean;
}
