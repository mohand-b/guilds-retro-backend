import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guild } from './entities/guild.entity';
import { GuildsService } from './services/guilds.service';
import { GuildsController } from './guilds.controller';
import { Alliance } from '../alliances/entities/alliance.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { GuildCreationCodeService } from './services/guild-creation-code.service';
import { GuildCreationCode } from './entities/guild-creation-code.entity';
import { Event } from '../events/entities/event';

@Module({
  imports: [
    TypeOrmModule.forFeature([Guild, GuildCreationCode, Alliance, Event, User]),
    UsersModule,
  ],
  controllers: [GuildsController],
  providers: [GuildsService, GuildCreationCodeService],
  exports: [GuildsService, GuildCreationCodeService],
})
export class GuildsModule {}
