import { IsOptional } from 'class-validator';

export class GuildSearchDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  minAverageLevel?: number;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

export class GuildSearchResponseDto {
  id: number;
  name: string;
  logo: Buffer | null;
  membersCount: number;
  averageLevel: number;
  leaderUsername: string;
}

export class PaginatedGuildSearchResponseDto {
  total: number;
  page: number;
  limit: number;
  results: GuildSearchResponseDto[];
}
