import { Guild } from '../../guilds/entities/guild.entity';

export class UserDto {
  id: number;
  username: string;
  characterClass: string;
  guild: Guild;
}
