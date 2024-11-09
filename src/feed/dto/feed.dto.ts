import { EventDto } from '../../events/dto/event.dto';
import { PostDto } from '../../posts/dto/post.dto';

export class FeedDto {
  id: number;
  post?: PostDto;
  event?: EventDto;
  createdAt: Date;
}
