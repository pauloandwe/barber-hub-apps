import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { WorkingHoursEntity } from './working-hours.entity';
import { ServiceEntity } from './service.entity';
import { BarberEntity } from './barber.entity';
import { SettingsEntity } from './settings.entity';
import { AppointmentEntity } from './appointment.entity';

@Entity('businesses')
export class BusinessEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => WorkingHoursEntity, (workingHours) => workingHours.business, {
    cascade: true,
    eager: true,
  })
  workingHours: WorkingHoursEntity[];

  @OneToMany(() => ServiceEntity, (service) => service.business, {
    cascade: true,
    eager: true,
  })
  services: ServiceEntity[];

  @OneToMany(() => BarberEntity, (barber) => barber.business, {
    cascade: true,
    eager: true,
  })
  barbers: BarberEntity[];

  @OneToOne(() => SettingsEntity, (settings) => settings.business, {
    cascade: true,
    eager: true,
  })
  settings: SettingsEntity;

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.business)
  appointments: AppointmentEntity[];
}
