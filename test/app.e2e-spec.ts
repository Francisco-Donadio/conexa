import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
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

  it('/auth/signup (POST)', () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: uniqueEmail,
        password: 'password123',
      })
      .expect(201);
  });
});
