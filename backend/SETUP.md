# Backend Setup Guide

## Quick Start

### Using Docker Compose (Recommended)

```bash
# From the backend directory
docker-compose up
```

This will:
1. Start PostgreSQL database on port 5432
2. Build and start NestJS backend on port 3001
3. The database will automatically create tables on startup

Access the API at: `http://localhost:3001`
Swagger docs at: `http://localhost:3001/api/docs`

### Local Development

#### Prerequisites
- Node.js 18+ installed
- PostgreSQL 14+ running locally
- npm installed

#### Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create/Configure .env file:**
   ```bash
   # Already created, but verify these values match your PostgreSQL setup
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USERNAME=barber_hub
   DATABASE_PASSWORD=barber_hub_password
   DATABASE_NAME=barber_hub_db
   ```

3. **Start development server:**
   ```bash
   npm run start:dev
   ```

4. **(Optional) Seed database with sample data:**
   ```bash
   npm run seed:run
   ```

The backend will start on `http://localhost:3001`

## Available Commands

```bash
# Development
npm run start:dev          # Start with auto-reload

# Production
npm run build              # Build for production
npm run start:prod         # Start production build

# Testing
npm run test               # Run unit tests
npm run test:watch        # Run tests in watch mode
npm run test:cov          # Generate coverage report
npm run test:e2e          # Run E2E tests

# Database
npm run seed:run          # Seed database with example data
npm run migration:generate # Generate migration from changes
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration

# Code Quality
npm run lint              # Run ESLint
npm run format            # Format code with Prettier
```

## Database Setup (if not using Docker)

If you're running PostgreSQL locally, create the database first:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE barber_hub_db;
CREATE USER barber_hub WITH PASSWORD 'barber_hub_password';
GRANT ALL PRIVILEGES ON DATABASE barber_hub_db TO barber_hub;
```

## Troubleshooting

### Port already in use
If port 3001 is already in use:
```bash
# Change in .env
PORT=3002

# Or kill process using port
lsof -i :3001
kill -9 <PID>
```

### Database connection error
Verify your `.env` file:
```bash
# Test connection
pg_isready -h localhost -p 5432 -U barber_hub
```

### npm install fails
Try:
```bash
npm install --legacy-peer-deps
```

## Integration with Frontend

The backend is configured with CORS for the frontend:

```env
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

To connect from frontend, use:
```
http://localhost:3001/auth/...
http://localhost:3001/appointments/...
```

## API Documentation

Interactive Swagger documentation available at:
```
http://localhost:3001/api/docs
```

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Environment mode |
| `PORT` | 3001 | Server port |
| `DATABASE_HOST` | localhost | PostgreSQL host |
| `DATABASE_PORT` | 5432 | PostgreSQL port |
| `DATABASE_USERNAME` | barber_hub | Database user |
| `DATABASE_PASSWORD` | barber_hub_password | Database password |
| `DATABASE_NAME` | barber_hub_db | Database name |
| `JWT_SECRET` | jwt-secret-key | JWT signing secret |
| `JWT_EXPIRATION` | 24h | Token expiration time |
| `CORS_ORIGIN` | localhost:3000,5173 | Allowed CORS origins |

**⚠️ Change `JWT_SECRET` in production!**

## Next Steps

1. Seed the database with sample data: `npm run seed:run`
2. Visit Swagger docs: `http://localhost:3001/api/docs`
3. Test the endpoints with sample business ID `153` and phone `5511999999999`
4. Configure frontend to connect to this backend
