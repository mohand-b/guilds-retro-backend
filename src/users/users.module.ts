import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { Job } from './entities/job.entity';
import { AccountLinkRequest } from './entities/account-link-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccountLinkRequest, Job, User])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
