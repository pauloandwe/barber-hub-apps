import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateReminderLogAppointmentFk1765478123456 implements MigrationInterface {
    name = 'UpdateReminderLogAppointmentFk1765478123456'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reminder_logs" DROP CONSTRAINT IF EXISTS "FK_5fd19e5f89c3f15c5cd8615d5fd"`);
        await queryRunner.query(`ALTER TABLE "reminder_logs" ALTER COLUMN "appointmentId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reminder_logs" ADD CONSTRAINT "FK_5fd19e5f89c3f15c5cd8615d5fd" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reminder_logs" DROP CONSTRAINT IF EXISTS "FK_5fd19e5f89c3f15c5cd8615d5fd"`);
        await queryRunner.query(`DELETE FROM "reminder_logs" WHERE "appointmentId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "reminder_logs" ALTER COLUMN "appointmentId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reminder_logs" ADD CONSTRAINT "FK_5fd19e5f89c3f15c5cd8615d5fd" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
