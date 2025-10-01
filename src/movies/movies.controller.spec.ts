import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  NotFoundException,
} from '@nestjs/common';
import * as request from 'supertest';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { PaginatedResponseDto } from './dto/paginated-response.dto';

describe('MoviesController (e2e)', () => {
  let app: INestApplication;
  const mockService = {
    create: jest.fn(),
    listMovies: jest.fn(),
    findMoviesPaginated: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    syncFromSwapi: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [{ provide: MoviesService, useValue: mockService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /movies should create a movie', async () => {
    const dto: CreateMovieDto = {
      title: 'A New Hope',
      episodeId: 4,
      director: 'George Lucas',
      producer: 'Gary Kurtz',
      releaseDate: '1977-05-25',
      openingCrawl: 'It is a period of civil war...',
    };

    const created = { ...dto, swapiId: 'manual-entry', id: 'abc123' };
    mockService.create.mockResolvedValue(created);

    const response = await request(app.getHttpServer())
      .post('/movies')
      .send(dto)
      .expect(201);

    expect(response.body).toEqual(created);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('GET /movies should return paginated movies', async () => {
    const result: PaginatedResponseDto<any> = {
      data: [{ id: '1', title: 'Test Movie' }],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    };
    mockService.findMoviesPaginated.mockResolvedValue(result);

    const response = await request(app.getHttpServer())
      .get('/movies')
      .expect(200);

    expect(response.body).toEqual(result);
    expect(mockService.findMoviesPaginated).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      sortBy: 'episodeId',
      sortOrder: 'asc',
    });
  });

  it('GET /movies should return paginated movies with query params', async () => {
    const result: PaginatedResponseDto<any> = {
      data: [{ id: '1', title: 'Test Movie' }],
      meta: {
        page: 2,
        limit: 5,
        total: 10,
        totalPages: 2,
        hasNext: false,
        hasPrevious: true,
      },
    };
    mockService.findMoviesPaginated.mockResolvedValue(result);

    const response = await request(app.getHttpServer())
      .get('/movies?page=2&limit=5&search=test')
      .expect(200);

    expect(response.body).toEqual(result);
    expect(mockService.findMoviesPaginated).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      search: 'test',
      sortBy: 'episodeId',
      sortOrder: 'asc',
    });
  });

  it('GET /movies/:id should return one movie', async () => {
    const movie = { id: '1', title: 'Single Movie' };
    mockService.findById.mockResolvedValue(movie);

    const response = await request(app.getHttpServer())
      .get('/movies/1')
      .expect(200);

    expect(response.body).toEqual(movie);
    expect(mockService.findById).toHaveBeenCalledWith('1');
  });

  it('GET /movies/:id should return 404 when movie not found', async () => {
    mockService.findById.mockRejectedValue(
      new NotFoundException('Movie with ID non-existent not found'),
    );

    const response = await request(app.getHttpServer())
      .get('/movies/non-existent')
      .expect(404);

    expect(response.body.message).toBe('Movie with ID non-existent not found');
    expect(mockService.findById).toHaveBeenCalledWith('non-existent');
  });

  it('PATCH /movies/:id should update a movie', async () => {
    const dto = {
      title: 'Updated Movie',
      episodeId: 2,
      director: 'Lucas',
      producer: 'Kurtz',
      releaseDate: '1980-05-17',
      openingCrawl: 'Update...',
    };

    const updated = { id: '1', ...dto };
    mockService.update.mockResolvedValue(updated);

    const response = await request(app.getHttpServer())
      .patch('/movies/1')
      .send(dto)
      .expect(200);

    expect(response.body).toEqual(updated);
    expect(mockService.update).toHaveBeenCalledWith('1', dto);
  });

  it('PATCH /movies/:id should return 404 when movie not found', async () => {
    const dto = { title: 'Updated Movie' };
    mockService.update.mockRejectedValue(
      new NotFoundException('Movie with ID non-existent not found'),
    );

    const response = await request(app.getHttpServer())
      .patch('/movies/non-existent')
      .send(dto)
      .expect(404);

    expect(response.body.message).toBe('Movie with ID non-existent not found');
  });

  it('DELETE /movies/:id should delete a movie', async () => {
    const deleted = { message: 'Movie with ID 1 has been deleted' };
    mockService.delete.mockResolvedValue(deleted);

    const response = await request(app.getHttpServer())
      .delete('/movies/1')
      .expect(200);

    expect(response.body).toEqual(deleted);
    expect(mockService.delete).toHaveBeenCalledWith('1');
  });

  it('DELETE /movies/:id should return 404 when movie not found', async () => {
    mockService.delete.mockRejectedValue(
      new NotFoundException('Movie with ID non-existent not found'),
    );

    const response = await request(app.getHttpServer())
      .delete('/movies/non-existent')
      .expect(404);

    expect(response.body.message).toBe('Movie with ID non-existent not found');
  });

  it('POST /movies/sync should trigger sync', async () => {
    mockService.syncFromSwapi.mockResolvedValue({
      message: 'Movies synced successfully',
    });

    const response = await request(app.getHttpServer())
      .post('/movies/sync')
      .expect(201);

    expect(response.body).toEqual({
      message: 'Movies synced successfully',
    });
    expect(mockService.syncFromSwapi).toHaveBeenCalled();
  });
});
