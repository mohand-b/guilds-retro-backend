import { IsEnum, IsNotEmpty } from 'class-validator';
import { CharacterClass } from '../enum/character-class.enum';
import { Gender } from '../enum/gender.enum';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Username is required' })
  username: string;

  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsNotEmpty({ message: 'Character class is required' })
  @IsEnum(CharacterClass)
  characterClass: CharacterClass;

  @IsNotEmpty({ message: 'Character level is required' })
  characterLevel: number;

  @IsNotEmpty({ message: 'Gender is required' })
  @IsEnum(Gender)
  gender: Gender;
}
