import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );
  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') || 3000;
  const prefix = config.get<string>('app.apiPrefix') || 'api';
  app.setGlobalPrefix(prefix);
  await app.listen(port);
}
bootstrap();
