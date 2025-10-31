import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailAndAddressToBusinesses1700000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "businesses"
      ADD COLUMN IF NOT EXISTS "email" VARCHAR(255) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "businesses"
      ADD COLUMN IF NOT EXISTS "address" VARCHAR(500) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "businesses"
      DROP COLUMN IF EXISTS "address"
    `);

    await queryRunner.query(`
      ALTER TABLE "businesses"
      DROP COLUMN IF EXISTS "email"
    `);
  }
}
