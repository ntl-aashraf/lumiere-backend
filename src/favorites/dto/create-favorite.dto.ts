// src/favorites/dto/create-favorite.dto.ts
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUrl,
  IsDateString,
} from 'class-validator';

export class CreateFavoriteDto {
  @IsString()
  videoId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  channelTitle?: string;

  @IsOptional()
  @IsString()
  channelId?: string;

  @IsString()
  watchUrl: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  type?: string;
}
