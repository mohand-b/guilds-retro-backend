import { Body, Controller, Post } from '@nestjs/common';
import { MembershipRequestsService } from './membership-requests.service';
import { CreateMembershipRequestDto } from './dto/create-membership-request.dto';

@Controller('membership-requests')
export class MembershipRequestsController {
  constructor(
    private readonly membershipRequestsService: MembershipRequestsService,
  ) {}

  @Post()
  async createRequest(
    @Body() createMembershipRequestDto: CreateMembershipRequestDto,
  ) {
    return await this.membershipRequestsService.createMembershipRequest(
      createMembershipRequestDto.userId,
      createMembershipRequestDto.guildId,
    );
  }
}
