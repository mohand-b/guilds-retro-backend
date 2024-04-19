import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGuildDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
