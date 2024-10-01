import { User } from '../../users/entities/user.entity';
import { Like } from '../../likes/entities/like.entity';
import { Comment } from '../../comments/entities/comment.entity';

export class PostDto {
  id: number;
  text: string;
  user: Partial<User>;
  createdAt: Date;
  updatedAt: Date;
  image: Buffer;
  likes: Partial<Like>[];
  commentCount: number;
  comments?: Comment[];
}
