// src/watch-later/dto/update-watch-later.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateWatchLaterDto } from './create-watch-later.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWatchLaterDto extends PartialType(CreateWatchLaterDto) {
  @ApiProperty({ description: 'Mark as watched', required: false })
  @IsOptional()
  @IsBoolean()
  isWatched?: boolean;
}
