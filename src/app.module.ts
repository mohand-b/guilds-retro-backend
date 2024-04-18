import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GuildModule } from './guild/guild.module';
import { UserModule } from './user/user.module';
import { EventModule } from './event/event.module';
import { AllianceModule } from './alliance/alliance.module';
import { TypeOrmModule } from '@nestjs/typeorm';

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
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    GuildModule,
    UserModule,
    EventModule,
    AllianceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
