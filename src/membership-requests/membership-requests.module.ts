import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipRequestsService } from './membership-requests.service';

import { UsersService } from '../users/users.service';
import { MembershipRequest } from './entities/membership-request.entity';
import { Guild } from '../guilds/entities/guild.entity';
import { MembershipRequestsController } from './membership-requests.controller';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MembershipRequest, Guild, User]),
    UsersModule,
  ],
  controllers: [MembershipRequestsController],
  providers: [MembershipRequestsService, UsersService],
  exports: [MembershipRequestsService],
})
export class MembershipRequestsModule {}
