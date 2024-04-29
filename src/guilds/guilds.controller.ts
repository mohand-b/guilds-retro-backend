import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { GuildsService } from './guilds.service';
import { Guild } from './entities/guild.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

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
  getGuildMembers(
    @Param('guildId', ParseIntPipe) guildId: number,
  ): Promise<User[]> {
    return this.usersService.findMembersByGuild(guildId);
  }
}
