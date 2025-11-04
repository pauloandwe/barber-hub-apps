import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAssignmentStrategyToAppointments1730000000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'assignmentStrategy',
        type: 'enum',
        enum: ['manual', 'least_appointments'],
        default: "'manual'",
        comment: 'Strategy used to assign the professional to the appointment',
      }),
    );

    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'assignedByStrategy',
        type: 'boolean',
        default: false,
        comment: 'Indicates whether the professional was assigned automatically by strategy',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('appointments', 'assignedByStrategy');
    await queryRunner.dropColumn('appointments', 'assignmentStrategy');
  }
}
