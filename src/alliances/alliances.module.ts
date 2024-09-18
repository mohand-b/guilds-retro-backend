import { Module } from '@nestjs/common';
import { AlliancesService } from './alliances.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alliance } from './entities/alliance.entity';
import { GuildsModule } from '../guilds/guilds.module';
import { AlliancesController } from './alliances.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/entities/user.entity';
import { Guild } from '../guilds/entities/guild.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alliance, Guild, User]),
    GuildsModule,
    NotificationsModule,
  ],
  controllers: [AlliancesController],
  providers: [AlliancesService],
  exports: [AlliancesService],
})
export class AlliancesModule {}
