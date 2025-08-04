// app.module.ts - Nuclear SSL bypass
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './auth/entities/user.entity';
import { FavoritesModule } from './favorites/favorites.module';
import { WatchLaterModule } from './watch-later/watch-later.module';
import { Favorite } from './favorites/entities/favorite.entity';
import { WatchLater } from './watch-later/entities/watch-later.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction) {
          console.log('🚀 Railway Production DB Config - NUCLEAR SSL BYPASS');
          console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

          // Override Node.js TLS settings globally
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

          return {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            ssl: false, // Completely disable SSL
            entities: [User, Favorite, WatchLater],
            synchronize: false,
            logging: false,
            retryAttempts: 3,
            retryDelay: 3000,
            autoLoadEntities: true,
            extra: {
              connectionTimeoutMillis: 60000,
              idleTimeoutMillis: 60000,
              max: 10,
              statement_timeout: 60000,
              idle_in_transaction_session_timeout: 60000,
              ssl: false, // Also disable in extra options
            },
          };
        }

        // Local development
        return {
          type: 'postgres',
          host: configService.get<string>('DATABASE_HOST') ?? 'localhost',
          port: parseInt(
            configService.get<string>('DATABASE_PORT') ?? '5432',
            10,
          ),
          username: configService.get('DATABASE_USERNAME'),
          password: configService.get('DATABASE_PASSWORD'),
          database: configService.get('DATABASE_NAME'),
          ssl: false,
          entities: [User, Favorite, WatchLater],
          synchronize: false,
          logging: true,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    FavoritesModule,
    WatchLaterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
