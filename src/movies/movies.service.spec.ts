import { Test, TestingModule } from '@nestjs/testing';
import { MoviesService } from './movies.service';
import { DatabaseService } from '../shared/db/db.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PaginationDto } from './dto/pagination.dto';
import { NotFoundException } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');

describe('MoviesService', () => {
  let service: MoviesService;
  let db: {
    movie: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    const dbMock = {
      movie: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        { provide: DatabaseService, useValue: dbMock },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    db = module.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a movie', async () => {
    const dto: CreateMovieDto = {
      title: 'Test Movie',
      episodeId: 1,
      director: 'Lucas',
      producer: 'Kurtz',
      releaseDate: '1977-05-25',
      openingCrawl: 'A long time ago...',
    };

    const result = { ...dto, swapiId: 'manual-entry', id: 'abc123' };

    // Mock no existing movies with same title or episode ID
    db.movie.findFirst.mockResolvedValue(null);
    db.movie.create.mockResolvedValue(result);

    const movie = await service.create(dto);

    expect(db.movie.findFirst).toHaveBeenCalledWith({
      where: {
        title: {
          mode: 'insensitive',
          equals: 'test movie', // normalized title
        },
      },
    });
    expect(db.movie.findFirst).toHaveBeenCalledWith({
      where: { episodeId: dto.episodeId },
    });
    expect(db.movie.create).toHaveBeenCalledWith({
      data: { ...dto, swapiId: 'manual-entry' },
    });
    expect(movie).toEqual(result);
  });

  it('should throw ConflictException when movie with same title exists', async () => {
    const dto: CreateMovieDto = {
      title: 'Existing Movie',
      episodeId: 1,
      director: 'Lucas',
      producer: 'Kurtz',
      releaseDate: '1977-05-25',
    };

    // Mock existing movie with same title
    db.movie.findFirst.mockResolvedValueOnce({
      id: '1',
      title: 'Existing Movie',
    });

    await expect(service.create(dto)).rejects.toThrow(
      'Movie with title "Existing Movie" already exists',
    );
    expect(db.movie.findFirst).toHaveBeenCalledWith({
      where: {
        title: {
          mode: 'insensitive',
          equals: 'existing movie', // normalized title
        },
      },
    });
    expect(db.movie.create).not.toHaveBeenCalled();
  });

  it('should throw ConflictException when movie with same episode ID exists', async () => {
    const dto: CreateMovieDto = {
      title: 'New Movie',
      episodeId: 4,
      director: 'Lucas',
      producer: 'Kurtz',
      releaseDate: '1977-05-25',
    };

    // Mock no existing movie with same title, but existing with same episode ID
    db.movie.findFirst
      .mockResolvedValueOnce(null) // No movie with same title
      .mockResolvedValueOnce({ id: '2', episodeId: 4 }); // Movie with same episode ID

    await expect(service.create(dto)).rejects.toThrow(
      'Movie with episode ID 4 already exists',
    );
    expect(db.movie.findFirst).toHaveBeenCalledWith({
      where: {
        title: {
          mode: 'insensitive',
          equals: 'new movie', // normalized title
        },
      },
    });
    expect(db.movie.findFirst).toHaveBeenCalledWith({
      where: { episodeId: dto.episodeId },
    });
    expect(db.movie.create).not.toHaveBeenCalled();
  });

  it('should throw ConflictException when movie with same title but different case exists', async () => {
    const dto: CreateMovieDto = {
      title: 'a new hope', // Different case
      episodeId: 1,
      director: 'Lucas',
      producer: 'Kurtz',
      releaseDate: '1977-05-25',
    };

    // Mock existing movie with different case title
    db.movie.findFirst.mockResolvedValueOnce({
      id: '1',
      title: 'A New Hope', // Existing movie with different case
    });

    await expect(service.create(dto)).rejects.toThrow(
      'Movie with title "a new hope" already exists',
    );
    expect(db.movie.findFirst).toHaveBeenCalledWith({
      where: {
        title: {
          mode: 'insensitive',
          equals: 'a new hope', // normalized title
        },
      },
    });
    expect(db.movie.create).not.toHaveBeenCalled();
  });

  it('should throw ConflictException when movie with same title but different case (uppercase) exists', async () => {
    const dto: CreateMovieDto = {
      title: 'A NEW HOPE', // Different case
      episodeId: 1,
      director: 'Lucas',
      producer: 'Kurtz',
      releaseDate: '1977-05-25',
    };

    // Mock existing movie with different case title
    db.movie.findFirst.mockResolvedValueOnce({
      id: '1',
      title: 'A New Hope', // Existing movie with different case
    });

    await expect(service.create(dto)).rejects.toThrow(
      'Movie with title "A NEW HOPE" already exists',
    );
    expect(db.movie.findFirst).toHaveBeenCalledWith({
      where: {
        title: {
          mode: 'insensitive',
          equals: 'a new hope', // normalized title
        },
      },
    });
    expect(db.movie.create).not.toHaveBeenCalled();
  });

  it('should throw ConflictException when movie with same title but with whitespace exists', async () => {
    const dto: CreateMovieDto = {
      title: 'A New Hope ', // With trailing whitespace
      episodeId: 1,
      director: 'Lucas',
      producer: 'Kurtz',
      releaseDate: '1977-05-25',
    };

    // Mock existing movie with different whitespace
    db.movie.findFirst.mockResolvedValueOnce({
      id: '1',
      title: 'A New Hope', // Existing movie without trailing whitespace
    });

    await expect(service.create(dto)).rejects.toThrow(
      'Movie with title "A New Hope " already exists',
    );
    expect(db.movie.findFirst).toHaveBeenCalledWith({
      where: {
        title: {
          mode: 'insensitive',
          equals: 'a new hope', // normalized title (trimmed and lowercase)
        },
      },
    });
    expect(db.movie.create).not.toHaveBeenCalled();
  });

  it('should NOT create movie when title conflict exists', async () => {
    const dto: CreateMovieDto = {
      title: 'Existing Movie',
      episodeId: 1,
      director: 'Lucas',
      producer: 'Kurtz',
      releaseDate: '1977-05-25',
    };

    // Mock existing movie with same title
    db.movie.findFirst.mockResolvedValueOnce({
      id: '1',
      title: 'Existing Movie',
    });

    await expect(service.create(dto)).rejects.toThrow(
      'Movie with title "Existing Movie" already exists',
    );

    // Verify that create was never called
    expect(db.movie.create).not.toHaveBeenCalled();
  });

  it('should NOT create movie when episode ID conflict exists', async () => {
    const dto: CreateMovieDto = {
      title: 'New Movie',
      episodeId: 4,
      director: 'Lucas',
      producer: 'Kurtz',
      releaseDate: '1977-05-25',
    };

    // Mock no existing movie with same title, but existing with same episode ID
    db.movie.findFirst
      .mockResolvedValueOnce(null) // No movie with same title
      .mockResolvedValueOnce({ id: '2', episodeId: 4 }); // Movie with same episode ID

    await expect(service.create(dto)).rejects.toThrow(
      'Movie with episode ID 4 already exists',
    );

    // Verify that create was never called
    expect(db.movie.create).not.toHaveBeenCalled();
  });

  it('should list movies', async () => {
    const result = [{ id: '1' }, { id: '2' }];
    db.movie.findMany.mockResolvedValue(result);

    const movies = await service.listMovies();
    expect(db.movie.findMany).toHaveBeenCalledWith({
      orderBy: { episodeId: 'asc' },
    });
    expect(movies).toEqual(result);
  });

  it('should find a movie by id', async () => {
    const result = { id: '1', title: 'Test' };
    db.movie.findUnique.mockResolvedValue(result);

    const movie = await service.findById('1');
    expect(db.movie.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(movie).toEqual(result);
  });

  it('should throw NotFoundException when movie not found by id', async () => {
    db.movie.findUnique.mockResolvedValue(null);

    await expect(service.findById('non-existent-id')).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.findById('non-existent-id')).rejects.toThrow(
      'Movie with ID non-existent-id not found',
    );
  });

  it('should update a movie', async () => {
    const dto: UpdateMovieDto = {
      title: 'Updated',
      episodeId: 2,
      director: 'Lucas',
      producer: 'McCallum',
      releaseDate: '1980-05-21',
      openingCrawl: 'It is a dark time...',
    };

    const existingMovie = { id: '1', title: 'Original' };
    const result = { id: '1', ...dto };

    db.movie.findUnique.mockResolvedValue(existingMovie);
    db.movie.update.mockResolvedValue(result);

    const movie = await service.update('1', dto);
    expect(db.movie.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(db.movie.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: dto,
    });
    expect(movie).toEqual(result);
  });

  it('should throw NotFoundException when updating non-existent movie', async () => {
    const dto: UpdateMovieDto = { title: 'Updated' };
    db.movie.findUnique.mockResolvedValue(null);

    await expect(service.update('non-existent-id', dto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw ConflictException when updating movie with existing title', async () => {
    const existingMovie = { id: '1', title: 'Original', episodeId: 1 };
    const dto: UpdateMovieDto = { title: 'Existing Title' };

    db.movie.findUnique.mockResolvedValue(existingMovie);
    db.movie.findFirst.mockResolvedValue({ id: '2', title: 'Existing Title' });

    await expect(service.update('1', dto)).rejects.toThrow(
      'Movie with title "Existing Title" already exists',
    );
  });

  it('should throw ConflictException when updating movie with existing episode ID', async () => {
    const existingMovie = { id: '1', title: 'Original', episodeId: 1 };
    const dto: UpdateMovieDto = { episodeId: 4 };

    db.movie.findUnique.mockResolvedValue(existingMovie);
    db.movie.findFirst.mockResolvedValue({ id: '2', episodeId: 4 });

    await expect(service.update('1', dto)).rejects.toThrow(
      'Movie with episode ID 4 already exists',
    );
  });

  it('should allow updating movie with same title and episode ID', async () => {
    const existingMovie = { id: '1', title: 'Original', episodeId: 1 };
    const dto: UpdateMovieDto = { title: 'Original', episodeId: 1 };
    const result = { id: '1', ...dto };

    db.movie.findUnique.mockResolvedValue(existingMovie);
    db.movie.update.mockResolvedValue(result);

    const movie = await service.update('1', dto);
    expect(movie).toEqual(result);
    expect(db.movie.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: dto,
    });
  });

  it('should allow updating movie with different fields that do not conflict', async () => {
    const existingMovie = {
      id: '1',
      title: 'Original',
      episodeId: 1,
      director: 'Old Director',
    };
    const dto: UpdateMovieDto = { director: 'New Director' };
    const result = { id: '1', ...existingMovie, ...dto };

    db.movie.findUnique.mockResolvedValue(existingMovie);
    db.movie.update.mockResolvedValue(result);

    const movie = await service.update('1', dto);
    expect(movie).toEqual(result);
  });

  it('should delete a movie', async () => {
    const existingMovie = { id: '1', title: 'Original' };
    db.movie.findUnique.mockResolvedValue(existingMovie);
    db.movie.delete.mockResolvedValue({});

    const result = await service.delete('1');
    expect(db.movie.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(db.movie.delete).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(result).toEqual({ message: 'Movie with ID 1 has been deleted' });
  });

  it('should throw NotFoundException when deleting non-existent movie', async () => {
    db.movie.findUnique.mockResolvedValue(null);

    await expect(service.delete('non-existent-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('findMoviesPaginated', () => {
    it('should return paginated movies with default parameters', async () => {
      const movies = [
        { id: '1', title: 'Movie 1', episodeId: 1 },
        { id: '2', title: 'Movie 2', episodeId: 2 },
      ];

      db.movie.count.mockResolvedValue(2);
      db.movie.findMany.mockResolvedValue(movies);

      const paginationDto: PaginationDto = {};
      const result = await service.findMoviesPaginated(paginationDto);

      expect(db.movie.count).toHaveBeenCalledWith({ where: {} });
      expect(db.movie.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { episodeId: 'asc' },
      });
      expect(result).toEqual({
        data: movies,
        meta: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      });
    });

    it('should return paginated movies with custom parameters', async () => {
      const movies = [{ id: '2', title: 'Movie 2', episodeId: 2 }];

      db.movie.count.mockResolvedValue(5);
      db.movie.findMany.mockResolvedValue(movies);

      const paginationDto: PaginationDto = {
        page: 2,
        limit: 2,
        sortBy: 'title',
        sortOrder: 'desc',
      };
      const result = await service.findMoviesPaginated(paginationDto);

      expect(db.movie.count).toHaveBeenCalledWith({ where: {} });
      expect(db.movie.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 2, // (page 2 - 1) * limit 2
        take: 2,
        orderBy: { title: 'desc' },
      });
      expect(result.meta).toEqual({
        page: 2,
        limit: 2,
        total: 5,
        totalPages: 3,
        hasNext: true,
        hasPrevious: true,
      });
    });

    it('should return paginated movies with search', async () => {
      const movies = [{ id: '1', title: 'A New Hope', episodeId: 4 }];

      db.movie.count.mockResolvedValue(1);
      db.movie.findMany.mockResolvedValue(movies);

      const paginationDto: PaginationDto = {
        search: 'lucas',
      };
      await service.findMoviesPaginated(paginationDto);

      const expectedWhere = {
        OR: [
          { title: { contains: 'lucas', mode: 'insensitive' } },
          { director: { contains: 'lucas', mode: 'insensitive' } },
          { producer: { contains: 'lucas', mode: 'insensitive' } },
        ],
      };

      expect(db.movie.count).toHaveBeenCalledWith({ where: expectedWhere });
      expect(db.movie.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        skip: 0,
        take: 10,
        orderBy: { episodeId: 'asc' },
      });
    });
  });

  it('should sync movies from SWAPI', async () => {
    const swapiResponse = {
      data: {
        result: [
          {
            uid: '123',
            properties: {
              title: 'A New Hope',
              episode_id: 4,
              director: 'George Lucas',
              producer: 'Gary Kurtz',
              release_date: '1977-05-25',
              opening_crawl: 'It is a period of civil war...',
            },
          },
        ],
      },
    };

    (axios.get as jest.Mock).mockResolvedValue(swapiResponse);
    db.movie.findUnique.mockResolvedValue(null);
    db.movie.create.mockResolvedValue({ id: '123' });

    const response = await service.syncFromSwapi();

    expect(axios.get).toHaveBeenCalledWith('https://www.swapi.tech/api/films');
    expect(db.movie.create).toHaveBeenCalled();
    expect(response).toEqual({
      message: 'Movies synced successfully',
      synced: 1,
      skipped: 0,
      total: 1,
    });
  });
});
