export class AllianceRequestDto {
  id: number;
  requesterGuild?: any;
  targetGuild?: any;
  status: string;
}

export class GuildAllianceRequestsDto {
  receivedAllianceRequests: AllianceRequestDto[];
  sentAllianceRequests: AllianceRequestDto[];
}

export class AllianceDto {
  id: number;
  requesterGuild: any;
  targetGuild: any;
  status: string;
}
