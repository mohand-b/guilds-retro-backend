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

  app.use((req, res, next) => {
    res.header(
      'Access-Control-Allow-Origin',
      'https://guilds-boune-angular-da8925932923.herokuapp.com',
    );
    res.header(
      'Access-Control-Allow-Methods',
      'GET,HEAD,PUT,PATCH,POST,DELETE',
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Accept, Authorization',
    );
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

  await app.listen(process.env.PORT || 3000);
}

bootstrap().then(() => console.log('Application started'));
