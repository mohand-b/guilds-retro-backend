import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CharacterClass } from '../enum/character-class.enum';

export class CreateUserDto {
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  password: string;

  @IsEnum(CharacterClass)
  characterClass: CharacterClass;

  @IsOptional()
  @IsString()
  guildName?: string;

  @IsOptional()
  guildId?: number;
}
