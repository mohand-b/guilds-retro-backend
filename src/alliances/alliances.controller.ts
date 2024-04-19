import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Alliance } from './entities/alliance.entity';
import { AlliancesService } from './alliances.service';

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

  @Patch(':id/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  async acceptRequest(@Param('id') id: number): Promise<void> {
    const alliance = await this.alliancesService.acceptAllianceRequest(id);
    if (!alliance) {
      throw new NotFoundException(`Alliance request #${id} not found`);
    }
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectRequest(@Param('id') id: number): Promise<void> {
    const alliance = await this.alliancesService.rejectAllianceRequest(id);
    if (!alliance) {
      throw new NotFoundException(`Alliance request #${id} not found`);
    }
  }
}
