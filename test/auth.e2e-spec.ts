import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same configuration as main.ts
    const { ValidationPipe } = await import('@nestjs/common');
    const { JwtAuthGuard } = await import('../src/guards/jwt-auth.guard');
    const { RolesGuard } = await import('../src/guards/roles.guard');
    const { Reflector } = await import('@nestjs/core');

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    const reflector = app.get(Reflector);
    app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/signup should create a new user', async () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const signupDto = {
      email: uniqueEmail,
      password: 'password123',
      role: 'USER',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(signupDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email', signupDto.email);
    expect(response.body).toHaveProperty('role', signupDto.role);
  });

  it('POST /auth/login should return access token', async () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;

    // First create a user
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: uniqueEmail,
        password: 'password123',
        role: 'USER',
      })
      .expect(201);

    // Then login
    const loginDto = {
      email: uniqueEmail,
      password: 'password123',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('user');

    accessToken = response.body.access_token;
  });

  it('GET /auth/profile should return user profile with valid token', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email');
    expect(response.body).toHaveProperty('role');
  });

  it('GET /auth/profile should return 401 without token', async () => {
    await request(app.getHttpServer()).get('/auth/profile').expect(401);
  });
});
