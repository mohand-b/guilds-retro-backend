import { IsNotEmpty, IsString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class CreateGuildLeaderDto extends CreateUserDto {
  @IsNotEmpty({ message: 'Guild name is required' })
  @IsString()
  guildName: string;

  @IsNotEmpty({ message: 'Level is required' })
  level: number;

  @IsString()
  description: string;

  logo: Buffer;
}
