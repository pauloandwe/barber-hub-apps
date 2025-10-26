import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "user_role_enum" AS ENUM ('ADMIN', 'BARBEARIA', 'CLIENTE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "appointment_status_enum" AS ENUM ('pendente', 'confirmado', 'cancelado');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "appointment_origin_enum" AS ENUM ('web', 'whatsapp');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create businesses table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "businesses" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "phone" VARCHAR(20) UNIQUE NOT NULL,
        "type" VARCHAR(50) NOT NULL,
        "token" VARCHAR(255) UNIQUE NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create profiles table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "profiles" (
        "id" SERIAL PRIMARY KEY,
        "nome" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "telefone" VARCHAR(20),
        "password_hash" VARCHAR(255) NOT NULL,
        "role" "user_role_enum" DEFAULT 'CLIENTE',
        "barbearia_id" INTEGER REFERENCES "businesses"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create working_hours table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "working_hours" (
        "id" SERIAL PRIMARY KEY,
        "businessId" INTEGER NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
        "dayOfWeek" INTEGER NOT NULL,
        "openTime" VARCHAR(5) NOT NULL,
        "closeTime" VARCHAR(5) NOT NULL,
        "breakStart" VARCHAR(5),
        "breakEnd" VARCHAR(5),
        "closed" BOOLEAN DEFAULT FALSE
      )
    `);

    // Create services table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "services" (
        "id" SERIAL PRIMARY KEY,
        "businessId" INTEGER NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "duration" INTEGER NOT NULL,
        "price" DECIMAL(10, 2) NOT NULL,
        "active" BOOLEAN DEFAULT TRUE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create barbers table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "barbers" (
        "id" SERIAL PRIMARY KEY,
        "businessId" INTEGER NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
        "name" VARCHAR(255) NOT NULL,
        "specialties" TEXT,
        "active" BOOLEAN DEFAULT TRUE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create settings table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "settings" (
        "id" SERIAL PRIMARY KEY,
        "businessId" INTEGER UNIQUE NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
        "reminderHours" TEXT DEFAULT '24,2',
        "enableReminders" BOOLEAN DEFAULT TRUE,
        "allowCancellation" BOOLEAN DEFAULT TRUE,
        "cancellationDeadlineHours" INTEGER DEFAULT 2,
        "allowReschedule" BOOLEAN DEFAULT TRUE,
        "rescheduleDeadlineHours" INTEGER DEFAULT 2,
        "autoConfirmAppointments" BOOLEAN DEFAULT TRUE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create appointments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "appointments" (
        "id" SERIAL PRIMARY KEY,
        "businessId" INTEGER NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
        "serviceId" INTEGER NOT NULL REFERENCES "services"("id") ON DELETE SET NULL,
        "barberId" INTEGER NOT NULL REFERENCES "barbers"("id") ON DELETE SET NULL,
        "clienteId" INTEGER NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
        "data_inicio" TIMESTAMP WITH TIME ZONE NOT NULL,
        "data_fim" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" "appointment_status_enum" DEFAULT 'pendente',
        "origem" "appointment_origin_enum" DEFAULT 'web',
        "observacoes" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create bloqueios table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bloqueios" (
        "id" SERIAL PRIMARY KEY,
        "barbeiro_id" INTEGER NOT NULL REFERENCES "barbers"("id") ON DELETE CASCADE,
        "data_inicio" TIMESTAMP WITH TIME ZONE NOT NULL,
        "data_fim" TIMESTAMP WITH TIME ZONE NOT NULL,
        "motivo" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_agendamentos_cliente" ON "appointments"("clienteId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_agendamentos_barbeiro" ON "appointments"("barberId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_agendamentos_barbearia" ON "appointments"("businessId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_agendamentos_data_inicio" ON "appointments"("data_inicio")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_barbeiros_barbearia" ON "barbers"("businessId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_servicos_barbearia" ON "services"("businessId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_profiles_email" ON "profiles"("email")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_bloqueios_barbeiro" ON "bloqueios"("barbeiro_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bloqueios_barbeiro"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_profiles_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_servicos_barbearia"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_barbeiros_barbearia"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_agendamentos_data_inicio"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_agendamentos_barbearia"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_agendamentos_barbeiro"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_agendamentos_cliente"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "bloqueios"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "barbers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "services"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "working_hours"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "businesses"`);

    // Drop types
    await queryRunner.query(`DROP TYPE IF EXISTS "appointment_origin_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "appointment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
