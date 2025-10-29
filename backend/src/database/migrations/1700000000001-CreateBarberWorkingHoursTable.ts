import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBarberWorkingHoursTable1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "barber_working_hours" (
        "id" SERIAL PRIMARY KEY,
        "barberId" INTEGER NOT NULL REFERENCES "barbers"("id") ON DELETE CASCADE,
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
      ON "barber_working_hours" ("barberId", "dayOfWeek")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_barber_working_hours_unique"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "barber_working_hours"`);
  }
}
