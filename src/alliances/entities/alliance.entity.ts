import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class GuildAlliance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  status: string;
}
