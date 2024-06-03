import { GuildSummaryDto } from "../../guilds/dto/guild.dto";
import { UserDto } from "../../users/dto/user.dto";
import { RequestStatus } from "../enum/request-status.enum";

export class MembershipRequestDto {
  id: number;
  user: UserDto;
  guild: GuildSummaryDto;
  status: RequestStatus;
}
