import { UserDto } from '../../users/dto/user.dto';
import { RequestStatus } from '../enum/request-status.enum';

export class MembershipRequestDto {
  id: number;
  user: UserDto;
  guild: any;
  status: RequestStatus;
}
