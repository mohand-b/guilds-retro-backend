import { UserDto } from '../../users/dto/user.dto';
import { AllianceDto } from '../../alliances/dto/alliance.dto';
import { MembershipRequestDto } from '../../membership-requests/dto/membership-request.dto';
import { AccountLinkRequest } from '../../users/entities/account-link-request.entity';
import { EventDto } from '../../events/dto/event.dto';
import { Like } from '../../likes/entities/like.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';

export class NotificationDto {
  id: number;
  user: Pick<UserDto, 'id' | 'username'>;
  type: string;
  message: string;
  createdAt: Date;
  read: boolean;

  like?: Like;
  comment?: CommentEntity;
  event?: EventDto;
  accountLinkRequest?: AccountLinkRequest;
  membershipRequest?: MembershipRequestDto;
  alliance?: AllianceDto;
  emitter?: Pick<UserDto, 'id' | 'username'>;
}
