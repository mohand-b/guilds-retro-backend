import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GuildsService } from './services/guilds.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enum/user-role.enum';
import { GuildDto, PaginatedMemberResponseDto } from './dto/guild.dto';
import { GuildCreationCodeService } from './services/guild-creation-code.service';
import {
  GuildSearchDto,
  PaginatedGuildSearchResponseDto,
} from './dto/guild-search.dto';
import { EventStatsDto } from './dto/guild-stats.dto';
import { CharacterClass } from '../users/enum/character-class.enum';

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
  getCurrentGuild(@Req() req: any): Promise<any> {
    return this.guildsService.getCurrentGuild(req.user.userId);
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
  findAllRecruitingGuilds(): Promise<GuildDto[]> {
    return this.guildsService.findRecruitingGuilds();
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
  async getPaginatedMembers(
    @Param('guildId', ParseIntPipe) guildId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedMemberResponseDto> {
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;

    return this.guildsService.getPaginatedMembers(
      guildId,
      pageNumber,
      limitNumber,
    );
  }

  @Get(':guildId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  getGuildById(
    @Req() req: any,
    @Param('guildId', ParseIntPipe) guildId: number,
  ): Promise<any> {
    return this.guildsService.getGuildById(req.user.userId, guildId);
  }

  @Get(':guildId/member-classes-count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  async getMemberClassesCount(
    @Param('guildId') guildId: number,
  ): Promise<Record<CharacterClass, number>> {
    return this.guildsService.getMemberClassesCount(guildId);
  }

  @Get(':guildId/event-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  async getEventStats(
    @Param('guildId') guildId: number,
  ): Promise<EventStatsDto> {
    return this.guildsService.getEventStats(guildId);
  }

  @Get(':guildId/average-member-level')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  async getAverageMemberLevel(
    @Param('guildId') guildId: number,
  ): Promise<number> {
    return this.guildsService.getAverageMemberLevel(guildId);
  }

  @Patch(':guildId/level')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OFFICER)
  async updateGuildLevel(
    @Param('guildId', ParseIntPipe) guildId: number,
    @Body('level') level: number,
  ) {
    return this.guildsService.updateGuildLevel(guildId, level);
  }

  @Patch(':guildId/hide-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEADER)
  async updateHideStats(
    @Param('guildId', ParseIntPipe) guildId: number,
    @Body('hideStats') hideStats: boolean,
  ) {
    return this.guildsService.updateHideStats(guildId, hideStats);
  }
}
