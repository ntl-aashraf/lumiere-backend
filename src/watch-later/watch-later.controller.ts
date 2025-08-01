// src/watch-later/watch-later.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WatchLaterService } from './watch-later.service';
import { WatchLater } from './entities/watch-later.entity';
import { CreateWatchLaterDto } from './dto/create-watch-later.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('watch-later')
export class WatchLaterController {
  constructor(private readonly watchLaterService: WatchLaterService) {}

  @Post()
  async addToWatchLater(@Req() req, @Body() data: CreateWatchLaterDto) {
    console.log('Received DTO:', data);
    console.log('Is Valid:', data instanceof CreateWatchLaterDto);
    const userId = req.user.id;
    return this.watchLaterService.create(userId, data);
  }

  @Get()
  async getUserWatchLater(@Query('userId') userId: string) {
    return this.watchLaterService.findAll(userId);
  }

  @Delete(':id')
  async removeFromWatchLater(@Param('id') videoId: string, @Req() req) {
    const userId = req.user.id;

    return this.watchLaterService.removeByVideoId(userId, videoId);
  }

  @Delete()
  async clearUserWatchLater(@Query('userId') userId: string) {
    return this.watchLaterService.removeAll(userId);
  }
}
