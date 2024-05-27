import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
}
