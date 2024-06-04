import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Alliance } from './entities/alliance.entity';
import { AlliancesService } from './alliances.service';
import { AllianceDto, GuildAllianceRequestsDto } from './dto/alliance.dto';

@Controller('alliances')
export class AlliancesController {
  constructor(private readonly alliancesService: AlliancesService) {}

  @Post()
  async createRequest(
    @Body('requesterGuildId') requesterGuildId: number,
    @Body('targetGuildId') targetGuildId: number,
  ): Promise<Alliance> {
    return await this.alliancesService.createAllianceRequest(
      requesterGuildId,
      targetGuildId,
    );
  }

  @Patch('dissolve')
  async dissolveAlliance(
    @Body('guildId1') guildId1: number,
    @Body('guildId2') guildId2: number,
  ): Promise<AllianceDto> {
    if (!guildId1 || !guildId2) {
      throw new NotFoundException('Guild IDs must be provided');
    }
    return this.alliancesService.dissolveAlliance(guildId1, guildId2);
  }

  @Patch(':id/accept')
  async acceptRequest(@Param('id') id: number): Promise<AllianceDto> {
    return this.alliancesService.acceptAllianceRequest(id);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectRequest(@Param('id') id: number): Promise<void> {
    const alliance = await this.alliancesService.rejectAllianceRequest(id);
    if (!alliance) {
      throw new NotFoundException(`Alliance request #${id} not found`);
    }
  }

  @Get('requests/:guildId')
  async getAllianceRequests(
    @Param('guildId') guildId: number,
  ): Promise<GuildAllianceRequestsDto> {
    return this.alliancesService.getAllianceRequests(guildId);
  }
}
