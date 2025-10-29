import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BusinessEntity } from './business.entity';
import { AppointmentEntity } from './appointment.entity';
import { BloqueioEntity } from './bloqueio.entity';
import { BarberWorkingHoursEntity } from './barber-working-hours.entity';

@Entity('barbers')
export class BarberEntity {
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

  @ManyToOne(() => BusinessEntity, (business) => business.barbers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: BusinessEntity;

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.barber)
  appointments: AppointmentEntity[];

  @OneToMany(() => BloqueioEntity, (bloqueio) => bloqueio.barbeiro)
  bloqueios: BloqueioEntity[];

  @OneToMany(() => BarberWorkingHoursEntity, (workingHour) => workingHour.barber, {
    cascade: ['remove'],
  })
  workingHours: BarberWorkingHoursEntity[];
}
