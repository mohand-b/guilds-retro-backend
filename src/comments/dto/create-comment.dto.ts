import { IsInt, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  text: string;

  @IsInt()
  postId: number;
}
