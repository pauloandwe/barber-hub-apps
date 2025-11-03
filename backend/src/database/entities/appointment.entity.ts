import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BusinessEntity } from './business.entity';
import { ServiceEntity } from './service.entity';
import { ProfessionalEntity } from './professional.entity';
import { ProfileEntity } from './profile.entity';
import { ClientContactEntity } from './client-contact.entity';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELED = 'canceled',
}

export enum AppointmentOrigin {
  WEB = 'web',
  WHATSAPP = 'whatsapp',
}

@Entity('appointments')
export class AppointmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  businessId: number;

  @Column({ type: 'int' })
  serviceId: number;

  @Column({ type: 'int' })
  professionalId: number;

  @Column({ type: 'int', nullable: true })
  clientId: number | null;

  @Column({ type: 'int', nullable: true })
  clientContactId: number | null;

  @Column({ type: 'timestamp with time zone' })
  startDate: Date;

  @Column({ type: 'timestamp with time zone' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({
    type: 'enum',
    enum: AppointmentOrigin,
    default: AppointmentOrigin.WEB,
    nullable: true,
  })
  source: AppointmentOrigin;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => BusinessEntity, (business) => business.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: BusinessEntity;

  @ManyToOne(() => ServiceEntity, (service) => service.appointments, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'serviceId' })
  service: ServiceEntity;

  @ManyToOne(() => ProfessionalEntity, (professional) => professional.appointments, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'professionalId' })
  professional: ProfessionalEntity;

  @ManyToOne(() => ProfileEntity, (profile) => profile.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clientId' })
  client: ProfileEntity;

  @ManyToOne(() => ClientContactEntity, (contact) => contact.appointments, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'clientContactId' })
  clientContact: ClientContactEntity;
}
