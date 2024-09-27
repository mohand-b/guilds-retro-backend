import { UserDto } from '../../users/dto/user.dto';

export class CommentDto {
  id: number;
  text: string;
  createdAt: Date;
  postId: number;
  user: UserDto;
}
