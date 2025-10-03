import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../shared/db/db.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import axios from 'axios';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PaginationDto } from './dto/pagination.dto';
import { PaginatedResponseDto } from './dto/paginated-response.dto';
import { Movie } from '@prisma/client';

@Injectable()
export class MoviesService {
  constructor(private db: DatabaseService) {}

  async syncFromSwapi() {
    try {
      const response = await axios.get('https://www.swapi.tech/api/films');
      const films = response.data.result || response.data.results;

      if (!films || !Array.isArray(films)) {
        throw new Error('Unexpected SWAPI format');
      }

      let syncedCount = 0;
      let skippedCount = 0;

      for (const film of films) {
        const { uid, properties } = film;

        if (!uid || !properties) {
          console.warn('Skipping film with missing data:', film);
          continue;
        }

        const existing = await this.db.movie.findUnique({
          where: { swapiId: uid },
        });

        if (!existing) {
          await this.db.movie.create({
            data: {
              swapiId: uid,
              title: properties.title || 'Unknown Title',
              episodeId: properties.episode_id || 0,
              director: properties.director || 'Unknown Director',
              producer: properties.producer || 'Unknown Producer',
              releaseDate: properties.release_date || 'Unknown Date',
              openingCrawl: properties.opening_crawl || null,
            },
          });
          syncedCount++;
        } else {
          skippedCount++;
        }
      }

      return {
        message: 'Movies synced successfully',
        synced: syncedCount,
        skipped: skippedCount,
        total: films.length,
      };
    } catch (error) {
      console.error('Error syncing from SWAPI:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to sync movies: ${errorMessage}`);
    }
  }

  async create(dto: CreateMovieDto) {
    const normalizedTitle = dto.title.trim().toLowerCase();

    const existingByTitle = await this.db.movie.findFirst({
      where: {
        title: {
          mode: 'insensitive',
          equals: normalizedTitle,
        },
      },
    });

    if (existingByTitle) {
      throw new ConflictException(
        `Movie with title "${dto.title}" already exists`,
      );
    }

    const existingByEpisode = await this.db.movie.findFirst({
      where: { episodeId: dto.episodeId },
    });

    if (existingByEpisode) {
      throw new ConflictException(
        `Movie with episode ID ${dto.episodeId} already exists`,
      );
    }

    return this.db.movie.create({
      data: {
        ...dto,
        swapiId: 'manual-entry',
      },
    });
  }

  async listMovies() {
    return this.db.movie.findMany({
      orderBy: {
        episodeId: 'asc',
      },
    });
  }

  async findMoviesPaginated(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Movie>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'episodeId',
      sortOrder = 'asc',
      search,
    } = paginationDto;

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { director: { contains: search, mode: 'insensitive' as const } },
            { producer: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Get total count with search filter
    const total = await this.db.movie.count({ where });

    // Get paginated results
    const movies = await this.db.movie.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      data: movies,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrevious,
      },
    };
  }

  async findById(id: string): Promise<Movie> {
    const movie = await this.db.movie.findUnique({
      where: { id },
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    return movie;
  }

  async update(id: string, dto: UpdateMovieDto): Promise<Movie> {
    const existingMovie = await this.findById(id);

    if (dto.title && dto.title !== existingMovie.title) {
      const normalizedTitle = dto.title.trim().toLowerCase();
      const existingByTitle = await this.db.movie.findFirst({
        where: {
          title: {
            mode: 'insensitive',
            equals: normalizedTitle,
          },
        },
      });

      if (existingByTitle && existingByTitle.id !== id) {
        throw new ConflictException(
          `Movie with title "${dto.title}" already exists`,
        );
      }
    }

    if (dto.episodeId && dto.episodeId !== existingMovie.episodeId) {
      const existingByEpisodeId = await this.db.movie.findFirst({
        where: { episodeId: dto.episodeId },
      });

      if (existingByEpisodeId && existingByEpisodeId.id !== id) {
        throw new ConflictException(
          `Movie with episode ID ${dto.episodeId} already exists`,
        );
      }
    }

    return this.db.movie.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string): Promise<{ message: string }> {
    await this.findById(id);

    await this.db.movie.delete({
      where: { id },
    });

    return { message: `Movie with ID ${id} has been deleted` };
  }
}
