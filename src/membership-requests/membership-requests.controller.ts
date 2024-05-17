import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MembershipRequestsService } from './membership-requests.service';
import { CreateMembershipRequestDto } from './dto/create-membership-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enum/user-role.enum';

@Controller('membership-requests')
export class MembershipRequestsController {
  constructor(
    private readonly membershipRequestsService: MembershipRequestsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createRequest(
    @Body() createMembershipRequestDto: CreateMembershipRequestDto,
  ) {
    return await this.membershipRequestsService.createMembershipRequest(
      createMembershipRequestDto.userId,
      createMembershipRequestDto.guildId,
    );
  }

  @Post(':requestId/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OFFICER)
  @HttpCode(HttpStatus.OK)
  async acceptRequest(@Param('requestId') requestId: number) {
    return await this.membershipRequestsService.acceptMembershipRequest(
      requestId,
    );
  }

  @Post(':requestId/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OFFICER)
  @HttpCode(HttpStatus.OK)
  async rejectRequest(@Param('requestId') requestId: number) {
    return await this.membershipRequestsService.rejectMembershipRequest(
      requestId,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  async findPendingRequestsForGuild(@Query('guildId') guildId: number) {
    return await this.membershipRequestsService.findPendingRequestsForGuild(
      Number(guildId),
    );
  }
}
