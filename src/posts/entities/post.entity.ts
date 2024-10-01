import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Like } from '../../likes/entities/like.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { FeedEntity } from '../../feed/entities/feed.entity';

@Entity()
export class PostEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  text: string;

  @ManyToOne(() => User, (user) => user.posts)
  user: User;

  @OneToOne(() => FeedEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feedId' })
  feed: FeedEntity;

  @OneToMany(() => Comment, (comment) => comment.post, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.post, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  likes: Like[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'bytea', nullable: true })
  image: Buffer;
}
