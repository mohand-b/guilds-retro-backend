import { CommentDto } from './comment.dto';

export class PaginatedCommentsDto {
  total: number;
  page: number;
  limit: number;
  comments: CommentDto[];
}
