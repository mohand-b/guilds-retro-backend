import { IsNotEmpty } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class JoinGuildMemberDto extends CreateUserDto {
  @IsNotEmpty()
  guildId: number;
}
