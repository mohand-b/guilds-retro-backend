import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GuildsService } from './guilds.service';
import { Guild } from './entities/guild.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enum/user-role.enum';

@Controller('guilds')
export class GuildsController {
  constructor(
    private readonly guildsService: GuildsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  findAll(): Promise<Guild[]> {
    return this.guildsService.findAll();
  }

  @Get(':guildId/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  getGuildMembers(
    @Param('guildId', ParseIntPipe) guildId: number,
  ): Promise<User[]> {
    return this.usersService.findMembersByGuild(guildId);
  }

  @Get('current')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  getCurrentGuild(@Req() req: any): Promise<Guild> {
    return this.guildsService.findCurrentGuild(req.user.userId);
  }
}
