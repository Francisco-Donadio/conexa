import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMovieDto {
  @ApiProperty({ example: 'A New Hope' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  episodeId!: number;

  @ApiProperty({ example: 'George Lucas' })
  @IsString()
  @IsNotEmpty()
  director!: string;

  @ApiProperty({ example: 'Gary Kurtz, Rick McCallum' })
  @IsString()
  @IsNotEmpty()
  producer!: string;

  @ApiProperty({ example: '1977-05-25' })
  @IsString()
  @IsNotEmpty()
  releaseDate!: string;

  @ApiProperty({ example: 'It is a period of civil war...' })
  @IsString()
  @IsOptional()
  openingCrawl?: string;

  @ApiProperty({ example: '1' })
  @IsString()
  @IsOptional()
  swapiId?: string;
}
