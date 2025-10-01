import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  const config = new DocumentBuilder()
    .setTitle('Star Wars Movies API')
    .setDescription(
      `
      Backend NestJS API for Star Wars Movies Management
      
      ## Features
      - 🔑 JWT Authentication & Authorization
      - 👥 User Management (Signup/Login)
      - 🎬 Movie CRUD Operations
      - 🔄 SWAPI Synchronization
      - 📄 Pagination & Search
      - 🛡️ Role-based Access Control
      
      ## Authentication
      Use the \`/auth/signup\` endpoint to create an account, then \`/auth/login\` to get a JWT token.
      Include the token in the Authorization header: \`Bearer <your-token>\`
      
      ## Roles
      - **USER**: Can view movies and get movie details
      - **ADMIN**: Can perform all operations including CRUD and sync
    `,
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Movies', 'Movie management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
