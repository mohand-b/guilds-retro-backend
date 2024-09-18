import { MemberDto } from '../../users/dto/user.dto';

export class GuildDto {
  id: number;
  name: string;
  description: string;
  logo: any;
  level: number;
  nbOfMembers?: number;
  members?: PaginatedMemberResponseDto;
  allies?: AllySummaryDto[];
  allowAlliances?: boolean;
  isAlly?: boolean;
}

export class GuildSummaryDto {
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

export class AllySummaryDto {
  id: number;
  name: string;
  level: number;
  logo: string;
  averageLevelOfMembers: number;
  nbOfMembers: number;
  leaderUsername: string;
}

export class PaginatedMemberResponseDto {
  results: MemberDto[];
  total: number;
  page: number;
  limit: number;
}

export class MemberSearchDto {
  guildId: number;
  page?: number;
  limit?: number;
}
