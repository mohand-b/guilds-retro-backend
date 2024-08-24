import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class OneWordQuestionnaire {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.questionnaire, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  age: string;

  @Column()
  firstName: string;

  @Column()
  favoritePizza: string;

  @Column()
  favoriteDessert: string;

  @Column()
  favoriteIceCreamFlavor: string;

  @Column()
  favoriteSeason: string;

  @Column()
  favoriteDofus: string;

  @Column()
  favoriteZone: string;

  @Column()
  favoriteFamiliar: string;

  @Column()
  reasonForRetro: string;
}
