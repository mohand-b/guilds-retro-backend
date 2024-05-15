import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGuildDto {
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  logo?: Buffer;

  @IsNumber()
  @IsOptional()
  level?: number;
}
