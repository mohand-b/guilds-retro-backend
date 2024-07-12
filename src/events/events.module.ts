import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event]), UsersModule],
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService, TypeOrmModule],
})
export class EventsModule {}
