import { IsOptional } from 'class-validator';

export class GuildSearchDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  minimumAverageLevel?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  page?: number;
}

export class GuildSearchResponseDto {
  id: number;
  name: string;
  logo: Buffer | null;
  membersCount: number;
}

export class PaginatedGuildSearchResponseDto {
  data: GuildSearchResponseDto[];
  total: number;
  page: number;
  limit: number;
}
