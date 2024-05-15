import { UserDto } from '../../users/dto/user.dto';

export class GuildDto {
  id: number;
  name: string;
  description: string;
  logo: any;
  level: number;
  members: UserDto[];
}

export class LightGuildDto {
  id: number;
  name: string;
  level: number;
  logo: string;
  capacity: number;
  averageLevelOfMembers: number;
  description: string;
  nbOfMembers: number;
  nbOfAllies: number;
  leaderUsername: string;
}
