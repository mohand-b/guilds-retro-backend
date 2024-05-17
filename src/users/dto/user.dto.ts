import { Guild } from '../../guilds/entities/guild.entity';
import { UserRole } from '../enum/user-role.enum';
import { CharacterClass } from '../enum/character-class.enum';

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
  guildId: number;
  guildAlliesIds: number[];
  role: UserRole;
}
