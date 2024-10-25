import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateGuildDto {
  @IsNumber()
  @IsOptional()
  level?: number;
  @IsString()
  @IsOptional()
  description?: string;
}
