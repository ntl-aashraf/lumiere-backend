// src/watch-later/watch-later.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchLater } from './entities/watch-later.entity';
import { CreateWatchLaterDto } from './dto/create-watch-later.dto';
import { UpdateWatchLaterDto } from './dto/update-watch-later.dto';

@Injectable()
export class WatchLaterService {
  constructor(
    @InjectRepository(WatchLater)
    private watchLaterRepository: Repository<WatchLater>,
  ) {}

  async create(
    userId: string,
    createWatchLaterDto: CreateWatchLaterDto,
  ): Promise<WatchLater> {
    try {
      // Check if already exists
      const existing = await this.watchLaterRepository.findOne({
        where: { userId, videoId: createWatchLaterDto.videoId },
      });

      if (existing) {
        throw new ConflictException('Video already in watch later');
      }

      const watchLater = this.watchLaterRepository.create({
        ...createWatchLaterDto,
        userId,
      });

      return await this.watchLaterRepository.save(watchLater);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to add to watch later');
    }
  }

  async findAll(
    userId: string,
    page = 1,
    limit = 20,
    showWatched = true,
  ): Promise<{
    data: WatchLater[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (!showWatched) {
      where.isWatched = false;
    }

    const [data, total] = await this.watchLaterRepository.findAndCount({
      where,
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

  async findOne(userId: string, id: string): Promise<WatchLater> {
    const watchLater = await this.watchLaterRepository.findOne({
      where: { id, userId },
    });

    if (!watchLater) {
      throw new NotFoundException('Watch later item not found');
    }

    return watchLater;
  }

  async findByVideoId(
    userId: string,
    videoId: string,
  ): Promise<WatchLater | null> {
    return await this.watchLaterRepository.findOne({
      where: { userId, videoId },
    });
  }

  async update(
    userId: string,
    id: string,
    updateWatchLaterDto: UpdateWatchLaterDto,
  ): Promise<WatchLater> {
    const watchLater = await this.findOne(userId, id);

    Object.assign(watchLater, updateWatchLaterDto);
    return await this.watchLaterRepository.save(watchLater);
  }

  async markAsWatched(userId: string, id: string): Promise<WatchLater> {
    return await this.update(userId, id, { isWatched: true });
  }

  async markAsUnwatched(userId: string, id: string): Promise<WatchLater> {
    return await this.update(userId, id, { isWatched: false });
  }

  async remove(userId: string, videoId: string): Promise<void> {
    const watchLater = await this.findOne(userId, videoId);
    await this.watchLaterRepository.remove(watchLater);
  }

  async removeByVideoId(userId: string, videoId: string): Promise<void> {
    const watchLater = await this.watchLaterRepository.findOne({
      where: { userId, videoId },
    });

    if (!watchLater) {
      throw new NotFoundException('Watch later item not found');
    }

    await this.watchLaterRepository.remove(watchLater);
  }

  async removeAll(userId: string): Promise<void> {
    await this.watchLaterRepository.delete({ userId });
  }

  async removeWatched(userId: string): Promise<void> {
    await this.watchLaterRepository.delete({ userId, isWatched: true });
  }

  async getCount(
    userId: string,
  ): Promise<{ total: number; watched: number; unwatched: number }> {
    const total = await this.watchLaterRepository.count({ where: { userId } });
    const watched = await this.watchLaterRepository.count({
      where: { userId, isWatched: true },
    });
    const unwatched = total - watched;

    return { total, watched, unwatched };
  }

  async isInWatchLater(userId: string, videoId: string): Promise<boolean> {
    const count = await this.watchLaterRepository.count({
      where: { userId, videoId },
    });
    return count > 0;
  }

  // Get recent watch later items (last 10)
  async getRecent(userId: string): Promise<WatchLater[]> {
    return await this.watchLaterRepository.find({
      where: { userId },
      order: { addedAt: 'DESC' },
      take: 10,
    });
  }

  // Get unwatched items only
  async getUnwatched(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    data: WatchLater[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await this.findAll(userId, page, limit, false);
  }

  // Search in watch later
  async search(
    userId: string,
    query: string,
    page = 1,
    limit = 20,
  ): Promise<{
    data: WatchLater[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.watchLaterRepository
      .createQueryBuilder('watchLater')
      .where('watchLater.userId = :userId', { userId })
      .andWhere(
        '(watchLater.title ILIKE :query OR watchLater.description ILIKE :query OR watchLater.channelTitle ILIKE :query)',
        { query: `%${query}%` },
      )
      .orderBy('watchLater.addedAt', 'DESC')
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
