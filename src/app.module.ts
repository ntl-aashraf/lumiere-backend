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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: 27004,
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        ssl:
          configService.get('DATABASE_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        entities: [User, Favorite, WatchLater],
        // synchronize: configService.get('NODE_ENV') === 'development', // Only for development
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
      }),
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
