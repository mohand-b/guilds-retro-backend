import { Module } from '@nestjs/common';
import { AlliancesService } from './alliances.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alliance } from './entities/alliance.entity';
import { GuildsModule } from '../guilds/guilds.module';
import { AlliancesController } from './alliances.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Alliance]), GuildsModule],
  controllers: [AlliancesController],
  providers: [AlliancesService],
  exports: [AlliancesService],
})
export class AlliancesModule {}
