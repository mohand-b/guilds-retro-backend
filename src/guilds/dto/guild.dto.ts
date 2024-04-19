import { UserDto } from '../../users/dto/user.dto';

export class GuildDto {
  id: number;
  name: string;
  description: string;
  members: UserDto[];
}
