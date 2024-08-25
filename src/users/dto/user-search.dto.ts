import { IsOptional } from 'class-validator';
import { CharacterClass } from '../enum/character-class.enum';

export class UserSearchDto {
  @IsOptional()
  username?: string;

  @IsOptional()
  characterClass?: CharacterClass;

  @IsOptional()
  characterLevel?: number;

  @IsOptional()
  jobName?: string;

  @IsOptional()
  jobLevel?: number;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
