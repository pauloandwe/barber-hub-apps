import { MigrationInterface, QueryRunner } from 'typeorm';

const ensureEnumType = async (
  queryRunner: QueryRunner,
  options: { schema?: string; name: string; values: string[] },
): Promise<void> => {
  const schema = options.schema ?? 'public';
  const enumValues = options.values.map((value) => `'${value}'`).join(', ');

  await queryRunner.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_type t
                INNER JOIN pg_namespace n ON n.oid = t.typnamespace
                WHERE t.typname = '${options.name}'
                  AND n.nspname = '${schema}'
            ) THEN
                CREATE TYPE "${schema}"."${options.name}" AS ENUM(${enumValues});
            END IF;
        END
        $$;
    `);
};

export class CreateReminderTables1762095734668 implements MigrationInterface {
  name = 'CreateReminderTables1762095734668';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await ensureEnumType(queryRunner, {
      name: 'reminder_settings_type_enum',
      values: ['CONFIRMATION', 'PRE_APPOINTMENT', 'POST_APPOINTMENT', 'RESCHEDULING'],
    });

    await ensureEnumType(queryRunner, {
      name: 'reminder_templates_type_enum',
      values: ['CONFIRMATION', 'PRE_APPOINTMENT', 'POST_APPOINTMENT', 'RESCHEDULING'],
    });

    await ensureEnumType(queryRunner, {
      name: 'reminder_logs_type_enum',
      values: ['CONFIRMATION', 'PRE_APPOINTMENT', 'POST_APPOINTMENT', 'RESCHEDULING'],
    });

    await ensureEnumType(queryRunner, {
      name: 'reminder_logs_status_enum',
      values: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'],
    });

    try {
      await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "reminder_settings" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "businessId" integer NOT NULL,
                    "type" "public"."reminder_settings_type_enum" NOT NULL,
                    "enabled" boolean NOT NULL DEFAULT true,
                    "hoursBeforeAppointment" text NOT NULL DEFAULT '[]',
                    "timezone" character varying,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_8967b53d42011ef8628dc889979" PRIMARY KEY ("id")
                )
            `);
    } catch (e) {}

    try {
      await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "reminder_templates" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "businessId" integer NOT NULL,
                    "type" "public"."reminder_templates_type_enum" NOT NULL,
                    "message" text NOT NULL,
                    "variables" text,
                    "active" boolean NOT NULL DEFAULT true,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_d4e1f6b10a440630468fcb0a451" PRIMARY KEY ("id")
                )
            `);
    } catch (e) {}

    try {
      await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "reminder_logs" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "appointmentId" integer NOT NULL,
                    "clientContactId" integer,
                    "type" "public"."reminder_logs_type_enum" NOT NULL,
                    "status" "public"."reminder_logs_status_enum" NOT NULL DEFAULT 'PENDING',
                    "scheduledAt" TIMESTAMP,
                    "sentAt" TIMESTAMP,
                    "messageId" character varying,
                    "message" text,
                    "error" text,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_b829028c9baa35c1f66188c186d" PRIMARY KEY ("id")
                )
            `);
    } catch (e) {}

    try {
      await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "client_preferences" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "clientContactId" integer,
                    "profileId" integer,
                    "remindersEnabled" boolean NOT NULL DEFAULT true,
                    "optOutDate" TIMESTAMP,
                    "preferredLanguage" character varying NOT NULL DEFAULT 'pt-BR',
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_0d06e691326d586481f28447cfb" PRIMARY KEY ("id")
                )
            `);
    } catch (e) {}

    try {
      await queryRunner.query(
        `ALTER TABLE "unavailability" ALTER COLUMN "created_at" SET NOT NULL`,
      );
    } catch (e) {}

    try {
      await queryRunner.query(
        `ALTER TABLE "unavailability" ALTER COLUMN "created_at" SET DEFAULT now()`,
      );
    } catch (e) {}

    try {
      await queryRunner.query(
        `ALTER TABLE "professional_working_hours" ALTER COLUMN "closed" SET NOT NULL`,
      );
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "professionals" ALTER COLUMN "active" SET NOT NULL`);
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "professionals" ALTER COLUMN "createdAt" SET NOT NULL`);
    } catch (e) {}

    try {
      await queryRunner.query(
        `ALTER TABLE "professionals" ALTER COLUMN "createdAt" SET DEFAULT now()`,
      );
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "profiles" ALTER COLUMN "role" SET NOT NULL`);
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "profiles" ALTER COLUMN "createdAt" SET NOT NULL`);
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "profiles" ALTER COLUMN "createdAt" SET DEFAULT now()`);
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "profiles" ALTER COLUMN "updatedAt" SET NOT NULL`);
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "profiles" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    } catch (e) {}

    try {
      await queryRunner.query(
        `ALTER TABLE "client_contacts" ALTER COLUMN "createdAt" SET NOT NULL`,
      );
    } catch (e) {}

    try {
      await queryRunner.query(
        `ALTER TABLE "client_contacts" ALTER COLUMN "createdAt" SET DEFAULT now()`,
      );
    } catch (e) {}

    try {
      await queryRunner.query(
        `ALTER TABLE "client_contacts" ALTER COLUMN "updatedAt" SET NOT NULL`,
      );
    } catch (e) {}

    try {
      await queryRunner.query(
        `ALTER TABLE "client_contacts" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
      );
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "serviceId" SET NOT NULL`);
    } catch (e) {}

    try {
      await queryRunner.query(
        `ALTER TABLE "appointments" ALTER COLUMN "professionalId" SET NOT NULL`,
      );
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "status" SET NOT NULL`);
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "createdAt" SET NOT NULL`);
    } catch (e) {}

    try {
      await queryRunner.query(
        `ALTER TABLE "appointments" ALTER COLUMN "createdAt" SET DEFAULT now()`,
      );
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "updatedAt" SET NOT NULL`);
    } catch (e) {}

    try {
      await queryRunner.query(
        `ALTER TABLE "appointments" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
      );
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "active" SET NOT NULL`);
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "createdAt" SET NOT NULL`);
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "createdAt" SET DEFAULT now()`);
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "reminderHours" SET NOT NULL`);
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "enableReminders" SET NOT NULL`);
    } catch (e) {}

    try {
      await queryRunner.query(
        `ALTER TABLE "settings" ALTER COLUMN "allowCancellation" SET NOT NULL`,
      );
    } catch (e) {}

    try {
      await queryRunner.query(
        `ALTER TABLE "settings" ALTER COLUMN "cancellationDeadlineHours" SET NOT NULL`,
      );
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "allowReschedule" SET NOT NULL`);
    } catch (e) {}

    try {
      await queryRunner.query(
        `ALTER TABLE "settings" ALTER COLUMN "rescheduleDeadlineHours" SET NOT NULL`,
      );
    } catch (e) {}

    try {
      await queryRunner.query(
        `ALTER TABLE "settings" ALTER COLUMN "autoConfirmAppointments" SET NOT NULL`,
      );
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "createdAt" SET NOT NULL`);
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "createdAt" SET DEFAULT now()`);
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "updatedAt" SET NOT NULL`);
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "businesses" ALTER COLUMN "createdAt" SET NOT NULL`);
    } catch (e) {}

    try {
      await queryRunner.query(
        `ALTER TABLE "businesses" ALTER COLUMN "createdAt" SET DEFAULT now()`,
      );
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "businesses" ALTER COLUMN "updatedAt" SET NOT NULL`);
    } catch (e) {}

    try {
      await queryRunner.query(
        `ALTER TABLE "businesses" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
      );
    } catch (e) {}

    try {
      await queryRunner.query(`ALTER TABLE "working_hours" ALTER COLUMN "closed" SET NOT NULL`);
    } catch (e) {}
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
