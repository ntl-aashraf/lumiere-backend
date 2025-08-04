import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Railway-specific: Add small delay to ensure env vars are loaded
  if (process.env.NODE_ENV === 'production') {
    logger.log('Production environment detected, adding startup delay...');
    await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
  }

  try {
    // Log ALL environment variables related to database (for debugging)
    logger.log('=== RAILWAY ENV DEBUG ===');
    logger.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
    logger.log(`DATABASE_HOST: ${process.env.DATABASE_HOST}`);
    logger.log(`DATABASE_PORT: ${process.env.DATABASE_PORT}`);
    logger.log(
      `DATABASE_USERNAME: ${process.env.DATABASE_USERNAME ? 'SET' : 'NOT SET'}`,
    );
    logger.log(
      `DATABASE_PASSWORD: ${process.env.DATABASE_PASSWORD ? 'SET' : 'NOT SET'}`,
    );
    logger.log(`DATABASE_NAME: ${process.env.DATABASE_NAME}`);
    logger.log(`DATABASE_SSL: ${process.env.DATABASE_SSL}`);
    logger.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    logger.log(`PORT: ${process.env.PORT}`);
    logger.log('========================');

    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug'], // More verbose logging
    });

    const configService = app.get(ConfigService);

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

    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    });

    app.setGlobalPrefix('api');

    const port = Number(process.env.PORT) || 3008;

    await app.listen(port, '0.0.0.0'); // Railway requires binding to 0.0.0.0
    logger.log(`🚀 Application is running on port: ${port}`);
  } catch (error) {
    logger.error('❌ Bootstrap Error:', error);
    logger.error('Error stack:', error.stack);
    process.exit(1);
  }
}

bootstrap();
