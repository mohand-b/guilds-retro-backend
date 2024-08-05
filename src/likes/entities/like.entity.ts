import { Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { Notification } from '../../notifications/entities/notification.entity';

@Entity()
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.likes)
  user: User;

  @ManyToOne(() => PostEntity, (post) => post.likes, { onDelete: 'CASCADE' })
  post: PostEntity;

  @OneToMany(() => Notification, (notification) => notification.like, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  notifications: Notification[];
}
