import { Guild } from '../../guilds/entities/guild.entity';
import { UserRole } from '../enum/user-role.enum';
import { CharacterClass } from '../enum/character-class.enum';
import { GuildDto } from '../../guilds/dto/guild.dto';

export class UserDto {
  id: number;
  username: string;
  characterClass: CharacterClass;
  characterLevel: number;
  guild: Guild;
}

export class UserLightDto {
  id: number;
  username: string;
  characterClass: CharacterClass;
  characterLevel: number;
  guild: Omit<GuildDto, 'members'>;
  guildAlliesIds: number[];
  role: UserRole;
}
