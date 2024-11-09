import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportEntity } from './entities/report.entity';
import { User } from '../users/entities/user.entity';
import { Event } from '../events/entities/event';
import { PostEntity } from '../posts/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReportEntity, User, Event, PostEntity])],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
