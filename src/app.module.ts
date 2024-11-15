import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GuildsModule } from './guilds/guilds.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { AlliancesModule } from './alliances/alliances.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MembershipRequestsModule } from './membership-requests/membership-requests.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { LikesModule } from './likes/likes.module';
import { FeedModule } from './feed/feed.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `./environments/.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get<string>('NODE_ENV') === 'production';
        return {
          type: 'postgres',
          url: config.get<string>('DATABASE_URL'),
          synchronize: true,
          autoLoadEntities: true,
          ssl: isProduction && { rejectUnauthorized: false },
        };
      },
      inject: [ConfigService],
    }),
    GuildsModule,
    UsersModule,
    EventsModule,
    AlliancesModule,
    AuthModule,
    MembershipRequestsModule,
    PostsModule,
    CommentsModule,
    LikesModule,
    FeedModule,
    NotificationsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
