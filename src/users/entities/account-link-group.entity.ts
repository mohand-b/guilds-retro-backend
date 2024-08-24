import { Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class AccountLinkGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => User, (user) => user.linkGroup)
  users: User[];
}
