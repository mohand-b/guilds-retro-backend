import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guild } from './entities/guild.entity';
import { GuildsService } from './guilds.service';
import { GuildsController } from './guilds.controller';
import { Alliance } from '../alliances/entities/alliance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Guild, Alliance])],
  controllers: [GuildsController],
  providers: [GuildsService],
  exports: [GuildsService],
})
export class GuildsModule {}
