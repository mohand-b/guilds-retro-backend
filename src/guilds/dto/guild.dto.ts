import { MemberDto } from '../../users/dto/user.dto';

export class GuildDto {
  id: number;
  name: string;
  description: string;
  logo: any;
  level: number;
  leaderUsername?: string;
  memberCount?: number;
  allyCount?: number;
  capacity?: number;
  averageLevelOfMembers?: number;
  allies?: GuildDto[];
  allowAlliances?: boolean;
  isAlly?: boolean;
}

export class AllySummaryDto {
  id: number;
  name: string;
  level: number;
  logo: string;
  averageLevelOfMembers: number;
  memberCount: number;
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
