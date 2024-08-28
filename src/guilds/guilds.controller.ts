import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GuildsService } from './services/guilds.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enum/user-role.enum';
import { GuildDto, GuildSummaryDto } from './dto/guild.dto';
import { GuildCreationCodeService } from './services/guild-creation-code.service';
import {
  GuildSearchDto,
  PaginatedGuildSearchResponseDto,
} from './dto/guild-search.dto';

@Controller('guilds')
export class GuildsController {
  constructor(
    private readonly guildsService: GuildsService,
    private readonly guildCreationCodeService: GuildCreationCodeService,
    private readonly usersService: UsersService,
  ) {}

  @Get('current')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  getCurrentGuild(@Req() req: any): Promise<GuildDto> {
    return this.guildsService.findCurrentGuild(req.user.userId);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  async searchGuilds(
    @Query() guildSearchDto: GuildSearchDto,
  ): Promise<PaginatedGuildSearchResponseDto> {
    return this.guildsService.searchGuilds(guildSearchDto);
  }

  @Get('recruiting')
  findAllRecruitingGuilds(): Promise<GuildSummaryDto[]> {
    return this.guildsService.findRecruitingGuilds();
  }

  @Get('to-alliance')
  async findGuildsForAlliance(): Promise<GuildSummaryDto[]> {
    return this.guildsService.findGuildsForAlliance();
  }

  @Get('validate-guild-code')
  async validateGuildCode(@Query('code') code: string) {
    const guildName = await this.guildCreationCodeService.validateCode(code);
    return { guildName };
  }

  @Post('generate-creation-code')
  async generateGuildCode(@Body() body: { guildName: string }) {
    return this.guildCreationCodeService.generateCode(body.guildName);
  }

  @Get(':guildId/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  getGuildMembers(
    @Param('guildId', ParseIntPipe) guildId: number,
  ): Promise<User[]> {
    return this.usersService.findMembersByGuild(guildId);
  }

  @Get(':guildId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  getGuildById(
    @Req() req: any,
    @Param('guildId', ParseIntPipe) guildId: number,
  ): Promise<GuildDto | GuildSummaryDto> {
    return this.guildsService.findById(req.user.userId, guildId);
  }
}
