import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guild } from './entities/guild.entity';
import { GuildsService } from './guilds.service';
import { GuildsController } from './guilds.controller';
import { Alliance } from '../alliances/entities/alliance.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Guild, Alliance, User]), UsersModule],
  controllers: [GuildsController],
  providers: [GuildsService],
  exports: [GuildsService],
})
export class GuildsModule {}
