import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { OneWordQuestionnaire } from './entities/one-word-questionnaire.entity';
import { UserSearchDto } from './dto/user-search.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @Patch('hide-profile')
  async updateHideProfile(
    @Req() req: any,
    @Body('hideProfile') hideProfile: boolean,
  ) {
    return this.usersService.updateHideProfile(req.user.userId, hideProfile);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @Get('linked-accounts')
  async getLinkedAccounts(@Req() req: any): Promise<User[]> {
    return this.usersService.getLinkedAccounts(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  @Get('search')
  async searchUsers(@Query() userSearchDto: UserSearchDto) {
    const [users, total] = await this.usersService.searchUsers(userSearchDto);
    return {
      data: users,
      total,
      page: userSearchDto.page,
      limit: userSearchDto.limit,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @Get(':username')
  getUserByUsername(@Param('username') username: string): Promise<User> {
    return this.usersService.findOneByUsername(username);
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
  @Post('jobs')
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
  @Patch('jobs/:jobId/level')
  async updateJobLevel(
    @Req() req: any,
    @Param('jobId') jobId: number,
    @Body('level') level: number,
  ): Promise<Job> {
    return this.usersService.updateJobLevel(req.user.userId, jobId, level);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @Delete('jobs/:jobId')
  async removeJob(
    @Req() req: any,
    @Param('jobId') jobId: number,
  ): Promise<void> {
    return this.usersService.removeJob(req.user.userId, jobId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @Get('find-for-link/:username')
  async findUserForAccountLinking(
    @Param('username') username: string,
    @Req() req: any,
  ): Promise<User> {
    const requesterId = req.user.userId;
    return this.usersService.findUserForAccountLinking(requesterId, username);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @Post('link-account/:targetUserId')
  async requestLinkAccount(
    @Req() req: any,
    @Param('targetUserId') targetUserId: number,
  ): Promise<AccountLinkRequest> {
    return this.usersService.requestLinkAccount(req.user.userId, targetUserId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @Post('link-requests/:id/accept')
  async acceptLinkRequest(@Param('id') requestId: number, @Req() req: any) {
    await this.usersService.acceptLinkRequest(requestId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @Post('link-requests/:id/reject')
  async rejectLinkRequest(@Param('id') requestId: number, @Req() req: any) {
    await this.usersService.rejectLinkRequest(requestId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @Patch('questionnaire')
  async updateQuestionnaire(
    @Req() req: any,
    @Body() updateData: Partial<OneWordQuestionnaire>,
  ) {
    return this.usersService.updateQuestionnaire(req.user.userId, updateData);
  }
}
