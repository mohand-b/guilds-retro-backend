import { GuildSummaryDto } from '../../guilds/dto/guild.dto';

export class AllianceDto {
  id: number;
  requesterGuild: GuildSummaryDto;
  status: string;
}
