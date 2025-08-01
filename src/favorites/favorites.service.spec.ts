// src/favorites/favorites.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoriteRepo: Repository<Favorite>,
  ) {}

  async create(data: Partial<Favorite>) {
    const exists = await this.favoriteRepo.findOne({
      where: { userId: data.userId, videoId: data.videoId },
    });

    if (exists) throw new ConflictException('Already in favorites');

    const entry = this.favoriteRepo.create(data);
    return this.favoriteRepo.save(entry);
  }

  async findAll(userId: string) {
    return this.favoriteRepo.find({
      where: { userId },
      order: { addedAt: 'DESC' },
    });
  }

  async remove(id: string, userId: string) {
    const item = await this.favoriteRepo.findOne({ where: { id, userId } });
    if (!item) throw new NotFoundException('Item not found');
    return this.favoriteRepo.remove(item);
  }

  async clearAll(userId: string) {
    await this.favoriteRepo.delete({ userId });
    return { message: 'All favorites cleared.' };
  }
}
