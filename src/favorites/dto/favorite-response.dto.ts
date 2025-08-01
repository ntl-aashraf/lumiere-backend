// src/favorites/dto/favorite-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class FavoriteResponseDto {
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
  addedAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
