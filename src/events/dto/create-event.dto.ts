import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  dungeonName?: string;

  @IsOptional()
  @IsString()
  arenaTargets?: string;

  @IsOptional()
  image?: Buffer;

  @IsOptional()
  @IsString()
  description: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsNotEmpty()
  maxParticipants: number;

  @IsOptional()
  minLevel?: number;

  @IsOptional()
  @IsString({ each: true })
  requiredClasses?: string[];

  @IsOptional()
  requiresOptimization?: boolean;

  @IsOptional()
  isAccessibleToAllies?: boolean;
}
