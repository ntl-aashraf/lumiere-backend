// src/watch-later/dto/watch-later-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class WatchLaterResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  videoId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  thumbnail: string;

  @ApiProperty()
  channelTitle: string;

  @ApiProperty()
  channelId: string;

  @ApiProperty()
  watchUrl: string;

  @ApiProperty()
  publishedAt: Date;

  @ApiProperty()
  year: number;

  @ApiProperty()
  type: string;

  @ApiProperty()
  isWatched: boolean;

  @ApiProperty()
  addedAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
