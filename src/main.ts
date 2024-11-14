import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import * as morgan from 'morgan';
import { ImageConversionInterceptor } from './common/interceptors/image-conversion.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalInterceptors(new ImageConversionInterceptor());
  app.use(morgan('dev'));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  const accessPolicy = process.env.ACCESS_POLICY || 'restrictive';

  app.enableCors({
    origin: accessPolicy === 'open' ? true : allowedOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'baggage'],
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000);
}

bootstrap().then(() => console.log('Application started'));
