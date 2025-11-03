# BarberHub Backend API

NestJS backend for BarberHub - WhatsApp AI Agent integration platform with PostgreSQL database.

## Features

- **Authentication & Business Management**: Get business info with `GET /auth/:businessId/:phone`
- **Appointments Management**: Full CRUD operations for appointments
- **Appointment Suggestions**: Auto-complete endpoint for appointment drafts
- **Working Hours & Availability**: Track business hours and manage professional schedules
- **Services & Professionals**: Manage services and professional information
- **Swagger Documentation**: Interactive API documentation at `/api/docs`
- **Type Safety**: Full TypeScript support with strict typing
- **Database**: PostgreSQL with TypeORM

## Prerequisites

- Node.js 18+ or Docker
- PostgreSQL 14+ (or use Docker Compose)
- npm or yarn

## Installation

### Option 1: Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file from example:**
   ```bash
   cp .env.example .env
   ```

3. **Configure database connection** in `.env`:
   ```env
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USERNAME=barber_hub
   DATABASE_PASSWORD=barber_hub_password
   DATABASE_NAME=barber_hub_db
   ```

4. **Start PostgreSQL** (ensure it's running on your system)

5. **Run development server:**
   ```bash
   npm run start:dev
   ```

6. **Seed database** (optional, for sample data):
   ```bash
   npm run seed:run
   ```

### Option 2: Docker Compose (Recommended)

1. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

2. **Start services:**
   ```bash
   docker-compose up
   ```

The application will start on `http://localhost:3001`

## API Endpoints

### Authentication
- `GET /auth/:businessId/:phone` - Get business info and authentication token

### Appointments
- `POST /appointments/suggest` - Get appointment suggestions
- `POST /:businessId/appointments` - Create appointment
- `PUT /:businessId/appointments/:appointmentId` - Update appointment
- `PATCH /:businessId/appointments/:appointmentId` - Partially update appointment
- `DELETE /:businessId/appointments/:appointmentId` - Delete appointment

## API Documentation

Access Swagger documentation at: `http://localhost:3001/api/docs`

## Database Schema

### Entities
- **businesses** - Business/Store information
- **working_hours** - Operating hours by day of week
- **services** - Available services (haircut, beard, etc.)
- **professionals** - Professional/Staff members
- **settings** - Business configuration
- **appointments** - Booked appointments

## Development

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Database Migrations
```bash
# Generate migration from entities
npm run migration:generate

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3001 |
| `DATABASE_HOST` | PostgreSQL host | localhost |
| `DATABASE_PORT` | PostgreSQL port | 5432 |
| `DATABASE_USERNAME` | PostgreSQL user | barber_hub |
| `DATABASE_PASSWORD` | PostgreSQL password | barber_hub_password |
| `DATABASE_NAME` | Database name | barber_hub_db |
| `JWT_SECRET` | JWT secret key | jwt-secret-key |
| `JWT_EXPIRATION` | JWT token expiration | 24h |
| `CORS_ORIGIN` | CORS allowed origins | http://localhost:5173,http://localhost:3000 |

## Project Structure

```
src/
├── modules/
│   ├── auth/           # Authentication module
│   └── appointments/   # Appointments module
├── common/
│   ├── dtos/          # Data Transfer Objects
│   ├── filters/       # Exception filters
│   └── interceptors/  # Response interceptors
├── config/            # Configuration files
├── database/
│   ├── entities/      # TypeORM entities
│   ├── migrations/    # Database migrations
│   └── seeds/         # Database seeds
└── main.ts           # Application entry point
```

## Response Format

All API responses follow this format:

```json
{
  "data": {
    "data": {
      // Response data
    }
  }
}
```

## Error Handling

Errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/auth/1/5511999999999"
}
```

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

MIT
