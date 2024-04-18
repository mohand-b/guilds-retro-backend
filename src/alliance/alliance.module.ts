import { Module } from '@nestjs/common';
import { AllianceController } from './alliance.controller';
import { AllianceService } from './alliance.service';

@Module({
  controllers: [AllianceController],
  providers: [AllianceService],
})
export class AllianceModule {}
