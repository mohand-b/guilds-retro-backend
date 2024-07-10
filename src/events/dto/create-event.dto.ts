import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  @IsString()
  dungeonName?: string;

  @IsOptional()
  @IsString()
  arenaTargets?: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsInt()
  @IsNotEmpty()
  maxParticipants: number;

  @IsOptional()
  @IsInt()
  minLevel?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredClasses?: string[];

  @IsOptional()
  @IsBoolean()
  requiresOptimization?: boolean;
}
