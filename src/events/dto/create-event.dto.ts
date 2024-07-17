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

  @IsString()
  @IsNotEmpty()
  description: string;

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

  @IsOptional()
  @IsBoolean()
  isAccessibleToAllies?: boolean;
}
