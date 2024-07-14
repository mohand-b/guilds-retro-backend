import { User } from '../../users/entities/user.entity';
import { Like } from '../../likes/entities/like.entity';
import { Comment } from '../../comments/entities/comment.entity';

export class PostFeedDto {
  id: number;
  text: string;
  user: User;
  likes: Like[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
  image: Buffer;
  feedId: string;
  feedType: string = 'post';
}
