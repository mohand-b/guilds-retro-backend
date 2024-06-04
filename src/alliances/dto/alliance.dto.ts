import { GuildSummaryDto } from '../../guilds/dto/guild.dto';

export class AllianceRequestDto {
  id: number;
  requesterGuild?: GuildSummaryDto;
  targetGuild?: GuildSummaryDto;
  status: string;
}

export class GuildAllianceRequestsDto {
  receivedAllianceRequests: AllianceRequestDto[];
  sentAllianceRequests: AllianceRequestDto[];
}

export class AllianceDto {
  id: number;
  requesterGuild: GuildSummaryDto;
  targetGuild: GuildSummaryDto;
  status: string;
}
