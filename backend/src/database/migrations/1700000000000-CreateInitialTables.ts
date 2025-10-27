import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TYPE IF EXISTS "appointment_origin_enum" CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS "appointment_status_enum" CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS "user_role_enum" CASCADE');

    await queryRunner.query(
      "CREATE TYPE \"user_role_enum\" AS ENUM ('ADMIN', 'BARBERSHOP', 'CLIENT')",
    );
    await queryRunner.query(
      "CREATE TYPE \"appointment_status_enum\" AS ENUM ('pending', 'confirmed', 'canceled')",
    );
    await queryRunner.query(
      "CREATE TYPE \"appointment_origin_enum\" AS ENUM ('web', 'whatsapp')",
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "businesses" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "phone" VARCHAR(20) UNIQUE NOT NULL,
        "type" VARCHAR(50) NOT NULL,
        "token" VARCHAR(255) UNIQUE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "profiles" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "phone" VARCHAR(20),
        "passwordHash" VARCHAR(255) NOT NULL,
        "role" "user_role_enum" DEFAULT 'CLIENT',
        "businessId" INTEGER REFERENCES "businesses"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "appointments" (
        "id" SERIAL PRIMARY KEY,
        "businessId" INTEGER NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
        "serviceId" INTEGER REFERENCES "services"("id") ON DELETE SET NULL,
        "barberId" INTEGER REFERENCES "barbers"("id") ON DELETE SET NULL,
        "clientId" INTEGER NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
        "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" "appointment_status_enum" DEFAULT 'pending',
        "source" "appointment_origin_enum" DEFAULT 'web',
        "notes" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_appointments_client" ON "appointments"("clientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_appointments_barber" ON "appointments"("barberId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_appointments_business" ON "appointments"("businessId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_appointments_startDate" ON "appointments"("startDate")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_barbers_business" ON "barbers"("businessId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_services_business" ON "services"("businessId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_profiles_email" ON "profiles"("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_bloqueios_barber" ON "bloqueios"("barbeiro_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bloqueios_barber"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_profiles_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_services_business"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_barbers_business"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_appointments_startDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_appointments_business"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_appointments_barber"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_appointments_client"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "bloqueios"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "barbers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "services"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "working_hours"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "businesses"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "appointment_origin_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "appointment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
