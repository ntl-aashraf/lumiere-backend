// src/favorites/favorites.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
// import { Favorite } from './entities/favorite.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  async addToFavorites(@Req() req, @Body() data: CreateFavoriteDto) {
    console.log('Received DTO:', data);
    console.log('Is Valid:', data instanceof CreateFavoriteDto);
    const userId = req.user.id;
    return this.favoritesService.create(userId, data);
  }

  @Get()
  async getUserFavorites(@Req() req) {
    const userId = req.user.id;

    return this.favoritesService.findAll(userId);
  }

  @Delete(':id')
  async removeFromFavorites(@Param('id') videoId: string, @Req() req) {
    const userId = req.user.id;
    return this.favoritesService.removeByVideoId(userId, videoId);
  }

  // DELETE /favorites
  @Delete()
  async clearUserFavorites(@Req() req) {
    const userId = req.user.id;
    return this.favoritesService.removeAll(userId);
  }
}
