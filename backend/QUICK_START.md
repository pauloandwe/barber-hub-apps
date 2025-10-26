# Quick Start Guide - Backend Setup

## 🚀 Fastest Setup (Using Docker Compose)

This is the recommended way to get started quickly. Everything is containerized!

### Prerequisites
- Docker and Docker Compose installed

### Steps

```bash
# 1. Navigate to backend directory
cd apps/backend

# 2. Start PostgreSQL and Backend
docker-compose up

# Wait for services to be ready...
# 3. In another terminal, run migrations and seeds
docker-compose exec backend npm run typeorm migration:run
docker-compose exec backend npm run seed:run

# 4. Visit API documentation
# Open browser: http://localhost:3001/api/docs
```

That's it! Your backend is running with a fresh database.

---

## 🔨 Manual Setup (Local PostgreSQL)

If you prefer to run PostgreSQL locally without Docker:

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Setup database and run migrations
./setup-db.sh

# 3. Start development server
npm run start:dev

# 4. Visit API documentation
# Open browser: http://localhost:3001/api/docs
```

The `setup-db.sh` script will:
- Check PostgreSQL connection
- Create database and user
- Run all migrations
- Seed with example data

---

## 🧪 Test the API

### Login as Admin

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@barberhub.com",
    "password": "admin123"
  }'
```

Response:
```json
{
  "data": {
    "data": {
      "id": 1,
      "email": "admin@barberhub.com",
      "nome": "Administrador",
      "role": "ADMIN",
      "access_token": "eyJhbGc..."
    }
  }
}
```

### Get Your Profile

```bash
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Business Info (WhatsApp Bot)

```bash
curl -X GET http://localhost:3001/auth/153/5511999999999
```

---

## 📊 Test Credentials

After running seeds, use these to test:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@barberhub.com | admin123 |
| **Barbearia** | barbearia@barberhub.com | barbearia123 |
| **Cliente 1** | cliente@barberhub.com | cliente123 |
| **Cliente 2** | cliente2@barberhub.com | cliente123 |

---

## 📚 API Documentation

Once backend is running, visit:

```
http://localhost:3001/api/docs
```

This shows all available endpoints with request/response examples.

---

## 🛠️ Common Commands

```bash
# Start development server with auto-reload
npm run start:dev

# Build for production
npm run build

# Run production build
npm run start:prod

# Run migrations
npm run typeorm migration:run

# Revert last migration
npm run typeorm migration:revert

# Seed database
npm run seed:run

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Lint code
npm run lint

# Format code
npm run format
```

---

## 🐛 Troubleshooting

### "Connection refused" error
PostgreSQL is not running:
```bash
# If using Docker Compose:
docker-compose up -d

# If local: Start your PostgreSQL service
```

### "Database does not exist" error
Run the setup script:
```bash
./setup-db.sh
```

### "Already has generated migration" error
Migrations already applied. This is normal. Just continue.

### Port 3001 already in use
Change the port in `.env`:
```env
PORT=3002
```

### Need to reset database completely
```bash
# With Docker Compose:
docker-compose down -v
docker-compose up
docker-compose exec backend npm run typeorm migration:run
docker-compose exec backend npm run seed:run

# With local PostgreSQL:
dropdb barber_hub_db
createdb barber_hub_db
npm run typeorm migration:run
npm run seed:run
```

---

## 📋 What Gets Created

### Tables
- **businesses** - Barbearias/Salões
- **profiles** - Perfis de usuários
- **barbers** - Barbeiros
- **services** - Serviços (Corte, Barba, etc)
- **working_hours** - Horários de funcionamento
- **appointments** - Agendamentos
- **bloqueios** - Bloqueios de horários
- **settings** - Configurações

### Example Data
- 1 Business (BarberHub)
- 3 Barbers (João, Pedro, Carlos)
- 5 Services (Corte, Corte+Barba, Barba, Platinado, Relaxamento)
- 4 Test Users (Admin, Barbearia, Cliente x2)

---

## 🚀 Next Steps

1. ✅ Backend running with database
2. 📝 Create API Client Layer in Frontend
3. 🔄 Migrate Frontend from Supabase to REST API
4. ✨ Remove Supabase dependencies
5. 🧪 Test complete flow
6. 🚀 Deploy!

For detailed migration guide, see [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

---

## 📞 Need Help?

- Check API docs: http://localhost:3001/api/docs
- Read [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- Check logs in terminal
- Ensure PostgreSQL is running: `pg_isready -h localhost -p 5432`

---

**Happy coding! 🎉**
