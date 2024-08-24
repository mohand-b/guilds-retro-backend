import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { Job } from './entities/job.entity';
import { AccountLinkRequest } from './entities/account-link-request.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AccountLinkGroup } from './entities/account-link-group.entity';
import { OneWordQuestionnaire } from './entities/one-word-questionnaire.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountLinkRequest,
      AccountLinkGroup,
      OneWordQuestionnaire,
      Job,
      User,
    ]),
    forwardRef(() => NotificationsModule),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
