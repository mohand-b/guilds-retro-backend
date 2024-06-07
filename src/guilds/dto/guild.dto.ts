import { MemberDto } from '../../users/dto/user.dto';
import { CharacterClass } from '../../users/enum/character-class.enum';

export class GuildDto {
  id: number;
  name: string;
  description: string;
  logo: any;
  level: number;
  members: MemberDto[];
  memberClassesCount?: Record<CharacterClass, number>;
  allies?: GuildSummaryDto[];
}

export class GuildSummaryDto {
  id: number;
  name: string;
  level: number;
  logo: string;
  capacity: number;
  averageLevelOfMembers: number;
  memberClassesCount: Record<CharacterClass, number>;
  description: string;
  nbOfMembers: number;
  nbOfAllies: number;
  leaderUsername: string;
}
