import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BusinessEntity } from './business.entity';
import { AppointmentEntity } from './appointment.entity';
import { UnavailabilityEntity } from './unavailability.entity';
import { ProfessionalWorkingHoursEntity } from './professional-working-hours.entity';

@Entity('professionals')
export class ProfessionalEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  businessId: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'simple-array', nullable: true })
  specialties: string[];

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => BusinessEntity, (business) => business.professionals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: BusinessEntity;

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.professional)
  appointments: AppointmentEntity[];

  @OneToMany(() => UnavailabilityEntity, (unavailability) => unavailability.professional)
  unavailability: UnavailabilityEntity[];

  @OneToMany(() => ProfessionalWorkingHoursEntity, (workingHour) => workingHour.professional, {
    cascade: ['remove'],
  })
  workingHours: ProfessionalWorkingHoursEntity[];
}
