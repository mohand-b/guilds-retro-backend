import { Controller, Get } from '@nestjs/common';
import { GuildsService } from './guilds.service';
import { Guild } from './entities/guild.entity';

@Controller('guilds')
export class GuildsController {
  constructor(private readonly guildsService: GuildsService) {}

  @Get()
  findAll(): Promise<Guild[]> {
    return this.guildsService.findAll();
  }
}
