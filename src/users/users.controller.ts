import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateFeedPreferenceDto } from './dto/update-feed-preference.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from './enum/user-role.enum';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserDto } from './dto/user.dto';
import { Job } from './entities/job.entity';
import { AccountLinkRequest } from './entities/account-link-request.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('feed-preference')
  async updateFeedPreference(
    @Req() req: any,
    @Body() updateFeedPreferenceDto: UpdateFeedPreferenceDto,
  ): Promise<User> {
    const { feedClosingToGuildAndAllies } = updateFeedPreferenceDto;
    return this.usersService.updateFeedPreference(
      req.user.userId,
      feedClosingToGuildAndAllies,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@Req() req: any): Promise<User> {
    return this.usersService.getCurrentUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OFFICER)
  @Patch(':userId/role')
  async updateUserRole(
    @Param('userId') userId: number,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ): Promise<UserDto> {
    const { role } = updateUserRoleDto;

    return this.usersService.updateUserRole(userId, role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @Post('job')
  async addJobToUser(
    @Req() req: any,
    @Body() addJobDto: { name: string; level: number; isForgemaging: boolean },
  ): Promise<Job> {
    const { name, level, isForgemaging } = addJobDto;
    return this.usersService.addJobToUser(
      req.user.userId,
      name,
      level,
      isForgemaging,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @Patch('job/:jobId/level')
  async updateJobLevel(
    @Req() req: any,
    @Param('jobId') jobId: number,
    @Body('level') level: number,
  ): Promise<Job> {
    return this.usersService.updateJobLevel(req.user.userId, jobId, level);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @Delete('job/:jobId')
  async removeJob(
    @Req() req: any,
    @Param('jobId') jobId: number,
  ): Promise<void> {
    return this.usersService.removeJob(req.user.userId, jobId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('link-account/:targetUserId')
  async requestLinkAccount(
    @Req() req: any,
    @Param('targetUserId') targetUserId: number,
  ): Promise<AccountLinkRequest> {
    return this.usersService.requestLinkAccount(req.user.userId, targetUserId);
  }

  @Post('link-requests/:id/accept')
  @UseGuards(JwtAuthGuard)
  async acceptLinkRequest(@Param('id') requestId: number, @Req() req: any) {
    await this.usersService.acceptLinkRequest(requestId, req.user.userI);
  }

  @Post('link-requests/:id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectLinkRequest(@Param('id') requestId: number, @Req() req: any) {
    await this.usersService.rejectLinkRequest(requestId, req.user.userI);
  }
}
