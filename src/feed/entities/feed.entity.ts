import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PostEntity } from '../../posts/entities/post.entity';
import { Event } from '../../events/entities/event';

@Entity()
export class FeedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => PostEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: PostEntity;

  @OneToOne(() => Event, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @CreateDateColumn()
  createdAt: Date;
}
