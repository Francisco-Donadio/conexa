# Star Wars Movies API 🎬

A NestJS backend API for managing Star Wars movies, integrating data from the public SWAPI.

## 🚀 Features

- **🔑 JWT Authentication & Authorization**
- **👥 User Management** (Signup/Login)
- **🎬 Movie CRUD Operations**
- **🔄 SWAPI Synchronization**
- **📄 Pagination & Search**
- **🛡️ Role-based Access Control**
- **📚 Swagger Documentation**
- **🧪 Complete Test Coverage**

## 🛠️ Tech Stack

- **NestJS** - Node.js Framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Swagger** - API Documentation
- **Jest** - Testing
- **Docker** - Containerization

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL
- npm or yarn

## 🚀 Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd conexa
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your configurations
```

4. **Set up database**

```bash
# Create PostgreSQL database
createdb conexa_db

# Run migrations
npx prisma migrate dev
```

5. **Run the application**

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 📚 API Documentation

Once the application is running, you can access the Swagger documentation at:

**http://localhost:3000/api**

The Swagger UI provides:

- Complete API endpoint documentation
- Interactive testing interface
- Request/response examples
- Authentication testing
- Schema definitions

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🐳 Docker

```bash
# Build image
docker build -t star-wars-api .

# Run container
docker run -p 3000:3000 star-wars-api
```

## 📊 Available Scripts

- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode
- `npm run start:prod` - Start in production mode
- `npm run build` - Build the application
- `npm test` - Run unit tests
- `npm run test:e2e` - Run e2e tests
- `npm run test:cov` - Run tests with coverage
- `npm run lint` - Run linter

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**May the force be with you!** ⭐
