import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const mockService = {
    signup: jest.fn(),
    login: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockService }],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/signup should register a user', async () => {
    const dto = {
      email: 'test@example.com',
      password: '123456',
      role: 'ADMIN',
    };

    const result = {
      id: 'user-id',
      email: dto.email,
      role: dto.role,
    };

    mockService.signup.mockResolvedValue(result);

    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(dto)
      .expect(201);

    expect(res.body).toEqual(result);
    expect(mockService.signup).toHaveBeenCalledWith(
      dto.email,
      dto.password,
      dto.role,
    );
  });

  it('POST /auth/login should return token', async () => {
    const dto = {
      email: 'test@example.com',
      password: '123456',
    };

    const token = { access_token: 'jwt.token.here' };

    mockService.login.mockResolvedValue(token);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send(dto)
      .expect(200);

    expect(res.body).toEqual(token);
    expect(mockService.login).toHaveBeenCalledWith(dto.email, dto.password);
  });
});
