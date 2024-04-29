import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
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

  @Post(':requestId/accept')
  @HttpCode(HttpStatus.OK)
  async acceptRequest(@Param('requestId') requestId: number) {
    return await this.membershipRequestsService.acceptMembershipRequest(
      requestId,
    );
  }

  @Post(':requestId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectRequest(@Param('requestId') requestId: number) {
    return await this.membershipRequestsService.rejectMembershipRequest(
      requestId,
    );
  }
}
