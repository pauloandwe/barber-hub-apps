#!/bin/bash

# BarberHub Backend Database Setup Script
# This script sets up the PostgreSQL database and runs migrations

set -e

echo "🔧 BarberHub Backend Database Setup"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
    echo -e "${GREEN}✓${NC} Loaded environment variables from .env"
else
    echo -e "${YELLOW}⚠${NC} .env file not found, using defaults"
fi

# Default values
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_USER="${DATABASE_USERNAME:-barber_hub}"
DB_PASSWORD="${DATABASE_PASSWORD:-barber_hub_password}"
DB_NAME="${DATABASE_NAME:-barber_hub_db}"

echo ""
echo "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Check if PostgreSQL is running
echo -e "${BLUE}→${NC} Checking PostgreSQL connection..."
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} PostgreSQL is not running on $DB_HOST:$DB_PORT"
    echo "  Please start PostgreSQL and try again"
    echo ""
    echo "  If using Docker Compose:"
    echo "    docker-compose up -d"
    exit 1
fi
echo -e "${GREEN}✓${NC} PostgreSQL is running"

# Create database and user if they don't exist
echo ""
echo -e "${BLUE}→${NC} Creating database and user..."

PGPASSWORD=postgres psql -h "$DB_HOST" -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD=postgres psql -h "$DB_HOST" -U postgres -c "CREATE DATABASE $DB_NAME;"

PGPASSWORD=postgres psql -h "$DB_HOST" -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1 || \
PGPASSWORD=postgres psql -h "$DB_HOST" -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"

PGPASSWORD=postgres psql -h "$DB_HOST" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo -e "${GREEN}✓${NC} Database and user ready"

# Run migrations
echo ""
echo -e "${BLUE}→${NC} Running migrations..."
npm run typeorm migration:run || {
    echo -e "${YELLOW}⚠${NC} Note: If you see 'Already has the codegenerated migration' error, the migrations may already be applied"
}
echo -e "${GREEN}✓${NC} Migrations completed"

# Seed the database
echo ""
echo -e "${BLUE}→${NC} Seeding database with example data..."
npm run seed:run || {
    echo -e "${YELLOW}⚠${NC} Seeding may have been skipped if data already exists"
}
echo -e "${GREEN}✓${NC} Seeding completed"

echo ""
echo -e "${GREEN}===================================="
echo "✓ Database setup completed successfully!"
echo "====================================${NC}"
echo ""
echo "Test credentials:"
echo "  Admin:     admin@barberhub.com / admin123"
echo "  Barbearia: barbearia@barberhub.com / barbearia123"
echo "  Client:    cliente@barberhub.com / cliente123"
echo ""
echo "Next steps:"
echo "  1. Start the backend:  npm run start:dev"
echo "  2. Visit API docs:     http://localhost:3001/api/docs"
echo ""
