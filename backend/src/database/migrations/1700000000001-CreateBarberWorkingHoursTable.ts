import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBarberWorkingHoursTable1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "professional_working_hours" (
        "id" SERIAL PRIMARY KEY,
        "professionalId" INTEGER NOT NULL REFERENCES "professionals"("id") ON DELETE CASCADE,
        "dayOfWeek" INTEGER NOT NULL,
        "openTime" VARCHAR(5),
        "closeTime" VARCHAR(5),
        "breakStart" VARCHAR(5),
        "breakEnd" VARCHAR(5),
        "closed" BOOLEAN DEFAULT FALSE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_barber_working_hours_unique"
      ON "professional_working_hours" ("professionalId", "dayOfWeek")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_barber_working_hours_unique"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "professional_working_hours"`);
  }
}
