// src/watch-later/watch-later.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
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
    private watchLaterRepo: Repository<WatchLater>,
  ) {}

  async create(
    userId: string,
    createWatchLaterDto: CreateWatchLaterDto,
  ): Promise<WatchLater> {
    try {
      const existing = await this.watchLaterRepo.findOne({
        where: { userId, videoId: createWatchLaterDto.videoId },
      });

      if (existing) throw new ConflictException('Already in watch later');

      const entry = this.watchLaterRepo.create({
        ...createWatchLaterDto,
        userId,
      });
      return this.watchLaterRepo.save(entry);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to add to favorites');
    }
  }

  async findAll(userId: string) {
    return this.watchLaterRepo.find({
      where: { userId },
      order: { addedAt: 'DESC' },
    });
  }

  async remove(id: string, userId: string) {
    const item = await this.watchLaterRepo.findOne({ where: { id, userId } });
    if (!item) throw new NotFoundException('Item not found');
    return this.watchLaterRepo.remove(item);
  }

  async clearAll(userId: string) {
    await this.watchLaterRepo.delete({ userId });
    return { message: 'All watch later items removed.' };
  }
}
