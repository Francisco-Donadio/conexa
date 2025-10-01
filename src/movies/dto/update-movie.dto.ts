import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMovieDto {
  @ApiProperty({ example: 'A New Hope' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  @IsOptional()
  episodeId?: number;

  @ApiProperty({ example: 'George Lucas' })
  @IsString()
  @IsOptional()
  director?: string;

  @ApiProperty({ example: 'Gary Kurtz, Rick McCallum' })
  @IsString()
  @IsOptional()
  producer?: string;

  @ApiProperty({ example: '1977-05-25' })
  @IsString()
  @IsOptional()
  releaseDate?: string;

  @ApiProperty({ example: 'It is a period of civil war...' })
  @IsString()
  @IsOptional()
  openingCrawl?: string;

  @ApiProperty({ example: '1' })
  @IsString()
  @IsOptional()
  swapiId?: string;
}
