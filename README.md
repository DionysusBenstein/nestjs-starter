# NestJS Starter

A NestJS starter template with authentication, user management, email service, and database setup.

## Features

- **Authentication**: JWT-based auth with access/refresh tokens, session management
- **User Management**: Registration, login, email verification, password reset
- **Email Service**: BullMQ queue-based email sending with Handlebars templates
- **Database**: PostgreSQL with TypeORM, migration support, transaction factory
- **API Documentation**: Swagger/OpenAPI with Dracula theme
- **Security**: Helmet, CORS, bcrypt password hashing
- **Docker**: Ready-to-use Docker Compose setup (dev & prod)

## Tech Stack

- NestJS 11
- TypeScript 5
- PostgreSQL 17 + TypeORM
- Redis + BullMQ
- JWT Authentication
- Swagger/OpenAPI
- Docker & Docker Compose

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- Docker & Docker Compose

### Setup

1. Copy the environment file and configure it:

```bash
cp .env.example .env
```

2. Start with Docker Compose (development):

```bash
docker compose -f compose.dev.yml --env-file .env up --build
```

3. Or start locally:

```bash
pnpm install
pnpm migration:run
pnpm start:dev
```

### API Documentation

Once running, visit `http://localhost:4000/docs` for Swagger documentation.

## Project Structure

```
src/
├── auth/                  # Authentication module
│   ├── dto/               # Auth DTOs (login, register, etc.)
│   ├── entities/          # Session, PasswordResetToken, VerificationCode
│   ├── guards/            # AuthGuard (JWT)
│   ├── services/          # AuthService, CustomJwtService, VerificationCodeService
│   └── utils/             # Request utilities
├── common/                # Shared utilities
│   ├── decorators/        # CurrentUser, Pagination, Filtering, Sorting decorators
│   ├── entities/          # AbstractEntity (base entity)
│   ├── enums/             # ErrorCode enum
│   ├── interceptors/      # ResponseInterceptor
│   ├── transformers/      # Decimal column transformer
│   └── utils/             # Object utils, auth utils, decimal utils
├── config/                # Environment config & validation
├── database/              # Database module, migrations, transaction factory
├── mail/                  # Email service with BullMQ queue
│   ├── enums/             # Mail job names
│   └── templates/         # Handlebars email templates
├── users/                 # User module
│   ├── dto/               # User DTOs
│   └── entities/          # User, Password entities
├── app.module.ts          # Root module
├── data-source.ts         # TypeORM CLI data source
└── main.ts                # Application entry point
```

## Scripts

| Command | Description |
|---|---|
| `pnpm start:dev` | Start in development mode (watch) |
| `pnpm start:prod` | Start in production mode |
| `pnpm build` | Build the project |
| `pnpm migration:create --name=migration-name` | Create a new migration |
| `pnpm migration:generate --name=migration-name` | Auto-generate migration from entities |
| `pnpm migration:run` | Run pending migrations |
| `pnpm migration:revert` | Revert last migration |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run tests |
