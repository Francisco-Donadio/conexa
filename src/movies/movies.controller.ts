import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { Roles } from '../decorators/role.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PaginationDto } from './dto/pagination.dto';
import { PaginatedResponseDto } from './dto/paginated-response.dto';
import { Movie } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

@ApiTags('Movies')
@ApiBearerAuth()
@Controller('movies')
export class MoviesController {
  logger: any;
  constructor(private readonly moviesService: MoviesService) {}

  @Post('sync')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync movies from SWAPI (Admin only)' })
  @ApiResponse({ status: 200, description: 'Movies synced successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sync() {
    return this.moviesService.syncFromSwapi();
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new movie (Admin only)' })
  @ApiBody({ type: CreateMovieDto })
  create(@Body() body: CreateMovieDto) {
    return this.moviesService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'List movies with pagination and search' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by (default: episodeId)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order (default: asc)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for title, director, or producer',
  })
  async list(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Movie>> {
    return this.moviesService.findMoviesPaginated(paginationDto);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a movie by ID' })
  @ApiResponse({ status: 200, description: 'Movie found successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findById(@Param('id') id: string) {
    return this.moviesService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a movie by ID (Admin only)' })
  @ApiBody({ type: UpdateMovieDto })
  @ApiResponse({ status: 200, description: 'Movie updated successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  update(@Param('id') id: string, @Body() body: UpdateMovieDto) {
    return this.moviesService.update(id, body);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a movie by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Movie deleted successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  delete(@Param('id') id: string) {
    return this.moviesService.delete(id);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncCron() {
    try {
      await this.moviesService.syncFromSwapi();
      this.logger.log('Movie sync completed successfully.');
    } catch (err) {
      this.logger.error('Movie sync failed', err);
    }
  }
}
