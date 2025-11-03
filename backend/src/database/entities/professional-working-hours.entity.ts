import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ProfessionalEntity } from './professional.entity';

@Entity('professional_working_hours')
@Unique(['professionalId', 'dayOfWeek'])
export class ProfessionalWorkingHoursEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  professionalId: number;

  @Column({ type: 'int' })
  dayOfWeek: number;

  @Column({ type: 'varchar', length: 5, nullable: true })
  openTime: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  closeTime: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  breakStart: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  breakEnd: string | null;

  @Column({ type: 'boolean', default: false })
  closed: boolean;

  @ManyToOne(() => ProfessionalEntity, (professional) => professional.workingHours, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'professionalId' })
  professional: ProfessionalEntity;
}

