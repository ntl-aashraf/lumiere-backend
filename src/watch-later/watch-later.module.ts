// src/watch-later/watch-later.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchLater } from './entities/watch-later.entity';
import { WatchLaterService } from './watch-later.service';
import { WatchLaterController } from './watch-later.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WatchLater])],
  controllers: [WatchLaterController],
  providers: [WatchLaterService],
})
export class WatchLaterModule {}
