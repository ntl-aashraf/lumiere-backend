// src/favorites/favorites.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
  ) {}

  async create(
    userId: string,
    createFavoriteDto: CreateFavoriteDto,
  ): Promise<Favorite> {
    try {
      // Check if already exists
      const existing = await this.favoritesRepository.findOne({
        where: { userId, videoId: createFavoriteDto.videoId },
      });

      if (existing) {
        throw new ConflictException('Video already in favorites');
      }

      const favorite = this.favoritesRepository.create({
        ...createFavoriteDto,
        userId,
      });

      return await this.favoritesRepository.save(favorite);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to add to favorites');
    }
  }

  async findAll(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    data: Favorite[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.favoritesRepository.findAndCount({
      where: { userId },
      order: { addedAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, id: string): Promise<Favorite> {
    const favorite = await this.favoritesRepository.findOne({
      where: { id, userId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    return favorite;
  }

  async findByVideoId(
    userId: string,
    videoId: string,
  ): Promise<Favorite | null> {
    return await this.favoritesRepository.findOne({
      where: { userId, videoId },
    });
  }

  async update(
    userId: string,
    id: string,
    updateFavoriteDto: UpdateFavoriteDto,
  ): Promise<Favorite> {
    const favorite = await this.findOne(userId, id);

    Object.assign(favorite, updateFavoriteDto);
    return await this.favoritesRepository.save(favorite);
  }

  async remove(userId: string, id: string): Promise<void> {
    const favorite = await this.findOne(userId, id);
    await this.favoritesRepository.remove(favorite);
  }

  async removeByVideoId(userId: string, videoId: string): Promise<void> {
    const favorite = await this.favoritesRepository.findOne({
      where: { userId, videoId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoritesRepository.remove(favorite);
  }

  async removeAll(userId: string): Promise<void> {
    await this.favoritesRepository.delete({ userId });
  }

  async getCount(userId: string): Promise<number> {
    return await this.favoritesRepository.count({ where: { userId } });
  }

  async isFavorite(userId: string, videoId: string): Promise<boolean> {
    const count = await this.favoritesRepository.count({
      where: { userId, videoId },
    });
    return count > 0;
  }

  async getRecent(userId: string): Promise<Favorite[]> {
    return await this.favoritesRepository.find({
      where: { userId },
      order: { addedAt: 'DESC' },
      take: 10,
    });
  }

  async search(
    userId: string,
    query: string,
    page = 1,
    limit = 20,
  ): Promise<{
    data: Favorite[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.favoritesRepository
      .createQueryBuilder('favorite')
      .where('favorite.userId = :userId', { userId })
      .andWhere(
        '(favorite.title ILIKE :query OR favorite.description ILIKE :query OR favorite.channelTitle ILIKE :query)',
        { query: `%${query}%` },
      )
      .orderBy('favorite.addedAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
