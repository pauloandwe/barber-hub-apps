# Database Migration Guide

## Overview

Este guia explica como usar as migrations TypeORM para criar e gerenciar o esquema do banco de dados.

## Estrutura das Migrations

```
src/database/migrations/
└── 1700000000000-CreateInitialTables.ts
```

## Tabelas Criadas

A migration inicial cria as seguintes tabelas baseadas no esquema do Supabase:

### 1. **profiles** - Perfis de Usuários
- `id` (INTEGER) - PK
- `nome` (VARCHAR)
- `email` (VARCHAR) - UNIQUE
- `telefone` (VARCHAR)
- `password_hash` (VARCHAR)
- `role` (ENUM: ADMIN, BARBEARIA, CLIENTE)
- `barbearia_id` (FK para businesses)
- `created_at`, `updated_at` (TIMESTAMP)

### 2. **businesses** - Estabelecimentos (Barbearias)
- `id` (INTEGER) - PK
- `name` (VARCHAR)
- `phone` (VARCHAR) - UNIQUE
- `type` (VARCHAR)
- `token` (VARCHAR) - UNIQUE
- `createdAt`, `updatedAt` (TIMESTAMP)

### 3. **barbers** - Barbeiros/Profissionais
- `id` (INTEGER) - PK
- `businessId` (FK)
- `name` (VARCHAR)
- `specialties` (TEXT - array)
- `active` (BOOLEAN)
- `createdAt` (TIMESTAMP)

### 4. **services** - Serviços Oferecidos
- `id` (INTEGER) - PK
- `businessId` (FK)
- `name` (VARCHAR)
- `description` (TEXT)
- `duration` (INTEGER - em minutos)
- `price` (DECIMAL)
- `active` (BOOLEAN)
- `createdAt` (TIMESTAMP)

### 5. **working_hours** - Horários de Funcionamento
- `id` (INTEGER) - PK
- `businessId` (FK)
- `dayOfWeek` (INTEGER: 0=Dom, 1=Seg, ..., 6=Sab)
- `openTime` (VARCHAR - HH:MM)
- `closeTime` (VARCHAR - HH:MM)
- `breakStart`, `breakEnd` (VARCHAR - HH:MM)
- `closed` (BOOLEAN)

### 6. **appointments** - Agendamentos
- `id` (INTEGER) - PK
- `businessId` (FK)
- `serviceId` (FK)
- `barberId` (FK)
- `clienteId` (FK para profiles)
- `data_inicio` (TIMESTAMP WITH TIME ZONE)
- `data_fim` (TIMESTAMP WITH TIME ZONE)
- `status` (ENUM: pendente, confirmado, cancelado)
- `origem` (ENUM: web, whatsapp)
- `observacoes` (TEXT)
- `createdAt`, `updatedAt` (TIMESTAMP)

### 7. **bloqueios** - Bloqueios de Horários
- `id` (INTEGER) - PK
- `barbeiro_id` (FK)
- `data_inicio` (TIMESTAMP WITH TIME ZONE)
- `data_fim` (TIMESTAMP WITH TIME ZONE)
- `motivo` (TEXT)
- `created_at` (TIMESTAMP)

### 8. **settings** - Configurações do Negócio
- `id` (INTEGER) - PK
- `businessId` (FK) - UNIQUE
- `reminderHours` (TEXT)
- `enableReminders`, `allowCancellation`, etc. (BOOLEAN)
- `createdAt`, `updatedAt` (TIMESTAMP)

## ENUMS Criados

```sql
-- user_role_enum
CREATE TYPE "user_role_enum" AS ENUM ('ADMIN', 'BARBEARIA', 'CLIENTE');

-- appointment_status_enum
CREATE TYPE "appointment_status_enum" AS ENUM ('pendente', 'confirmado', 'cancelado');

-- appointment_origin_enum
CREATE TYPE "appointment_origin_enum" AS ENUM ('web', 'whatsapp');
```

## Índices de Performance

As seguintes indexes foram criadas para otimizar queries:

```sql
idx_agendamentos_cliente
idx_agendamentos_barbeiro
idx_agendamentos_barbearia
idx_agendamentos_data_inicio
idx_barbeiros_barbearia
idx_servicos_barbearia
idx_profiles_email
idx_bloqueios_barbeiro
```

## Como Executar as Migrations

### 1. Criar o Banco de Dados (primeira vez)

```bash
# Conecte com seu PostgreSQL como superuser
psql -U postgres

# Crie o banco
CREATE DATABASE barber_hub_db;
CREATE USER barber_hub WITH PASSWORD 'barber_hub_password';
GRANT ALL PRIVILEGES ON DATABASE barber_hub_db TO barber_hub;
```

### 2. Executar as Migrations

```bash
# Gerar SQL sem executar (visualizar)
npm run typeorm migration:show

# Executar todas as migrations pendentes
npm run typeorm migration:run

# Revert da última migration
npm run typeorm migration:revert
```

### 3. Popular o Banco com Dados de Exemplo

```bash
npm run seed:run
```

Isso irá criar:
- 1 Business (BarberHub)
- 3 Serviços (Corte, Corte+Barba, Barba, etc)
- 3 Barbeiros (João, Pedro, Carlos)
- Configurações padrão
- 4 Usuários de teste:
  - `admin@barberhub.com` / `admin123` (Role: ADMIN)
  - `barbearia@barberhub.com` / `barbearia123` (Role: BARBEARIA)
  - `cliente@barberhub.com` / `cliente123` (Role: CLIENTE)
  - `cliente2@barberhub.com` / `cliente123` (Role: CLIENTE)

## Credentials de Teste

### Admin
```
Email: admin@barberhub.com
Password: admin123
Role: ADMIN
```

### Barbearia
```
Email: barbearia@barberhub.com
Password: barbearia123
Role: BARBEARIA
```

### Cliente 1
```
Email: cliente@barberhub.com
Password: cliente123
Role: CLIENTE
Phone: 5511987654321
```

### Cliente 2
```
Email: cliente2@barberhub.com
Password: cliente123
Role: CLIENTE
Phone: 5511987654322
```

## Criar Nova Migration

Se precisar adicionar novas colunas ou tabelas:

```bash
npm run typeorm migration:generate src/database/migrations/NomeDaMigracao
```

## Sincronizar Models com Banco (Development Only)

⚠️ **NUNCA use synchronize=true em produção!**

Para sincronizar automaticamente durante desenvolvimento (sem migrations):

```typescript
// Em database.config.ts
synchronize: process.env.NODE_ENV === 'development'
```

## Troubleshooting

### Erro: "Table already exists"
A migration foi executada antes. Para reverter:
```bash
npm run typeorm migration:revert
```

### Erro: "role assignment denied"
Certifique-se de que o usuário PostgreSQL tem permissões:
```bash
GRANT ALL ON ALL TABLES IN SCHEMA public TO barber_hub;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO barber_hub;
```

### Reconectar ao banco local
```bash
docker-compose down --volumes  # Remove volumes (dados)
docker-compose up               # Recria banco limpo
npm run typeorm migration:run   # Executa migrations
npm run seed:run                # Popula dados
```

## Referências

- [TypeORM Migrations Docs](https://typeorm.io/migrations)
- [PostgreSQL ENUM Docs](https://www.postgresql.org/docs/current/datatype-enum.html)
