import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipRequestsService } from './membership-requests.service';
import { MembershipRequest } from './entities/membership-request.entity';
import { Guild } from '../guilds/entities/guild.entity';
import { MembershipRequestsController } from './membership-requests.controller';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { GuildsModule } from '../guilds/guilds.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MembershipRequest, Guild, User]),
    UsersModule,
    GuildsModule,
    NotificationsModule,
  ],
  controllers: [MembershipRequestsController],
  providers: [MembershipRequestsService],
  exports: [MembershipRequestsService],
})
export class MembershipRequestsModule {}
