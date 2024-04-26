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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './environments/.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT'),
        username: config.get<string>('DATABASE_USERNAME'),
        password: config.get<string>('DATABASE_PASSWORD'),
        database: config.get<string>('DATABASE_NAME'),
        synchronize: true,
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    GuildsModule,
    UsersModule,
    EventsModule,
    AlliancesModule,
    AuthModule,
    MembershipRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
