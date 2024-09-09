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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enum/user-role.enum';
import { GuildSummaryDto, PaginatedMemberResponseDto } from './dto/guild.dto';
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
}
