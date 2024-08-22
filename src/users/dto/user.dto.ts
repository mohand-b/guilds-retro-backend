import { Guild } from '../../guilds/entities/guild.entity';
import { UserRole } from '../enum/user-role.enum';
import { CharacterClass } from '../enum/character-class.enum';
import { GuildDto } from '../../guilds/dto/guild.dto';
import { Gender } from '../enum/gender.enum';
import { Job } from '../entities/job.entity';

export class UserDto {
  id: number;
  username: string;
  characterClass: CharacterClass;
  characterLevel: number;
  guild: Guild;
}

export class MemberDto {
  id: number;
  username: string;
  characterClass: CharacterClass;
  gender: Gender;
  characterLevel: number;
  jobs: Job[];
  role: UserRole;
}

export class UserLightDto {
  id: number;
  username: string;
  characterClass: CharacterClass;
  gender: Gender;
  characterLevel: number;
  guild: Omit<GuildDto, 'members'>;
  guildAlliesIds: number[];
  jobs: Job[];
  role: UserRole;
}
