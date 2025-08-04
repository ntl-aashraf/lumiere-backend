import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  app.setGlobalPrefix('api');

  console.log('DATABASE HOST:', process.env.DATABASE_HOST);

  const port =
    Number(configService.get<string>('PORT')) ||
    Number(process.env.PORT) ||
    3008;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap().catch((error) => {
  // Log the error and exit the process
  console.error('Error during bootstrap:', error);
  process.exit(1);
});
