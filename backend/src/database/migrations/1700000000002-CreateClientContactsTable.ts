import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClientContactsTable1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "client_contacts" (
        "id" SERIAL PRIMARY KEY,
        "businessId" INTEGER NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
        "name" VARCHAR(255),
        "phone" VARCHAR(20) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UQ_client_contacts_business_phone" UNIQUE ("businessId", "phone")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_client_contacts_business" ON "client_contacts"("businessId")`,
    );

    await queryRunner.query(`
      ALTER TABLE "appointments"
      ALTER COLUMN "clientId" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD COLUMN IF NOT EXISTS "clientContactId" INTEGER REFERENCES "client_contacts"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_appointments_client_contact" ON "appointments"("clientContactId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_appointments_client_contact"`);

    await queryRunner.query(`
      ALTER TABLE "appointments"
      DROP COLUMN IF EXISTS "clientContactId"
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
      ALTER COLUMN "clientId" SET NOT NULL
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_client_contacts_business"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "client_contacts"`);
  }
}
