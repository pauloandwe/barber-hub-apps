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
import { BarberEntity } from './barber.entity';
import { ProfileEntity } from './profile.entity';

export enum AppointmentStatus {
  PENDENTE = 'pendente',
  CONFIRMADO = 'confirmado',
  CANCELADO = 'cancelado',
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
  barberId: number;

  @Column({ type: 'int' })
  clienteId: number;

  @Column({ type: 'timestamp with time zone' })
  data_inicio: Date;

  @Column({ type: 'timestamp with time zone' })
  data_fim: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDENTE,
  })
  status: AppointmentStatus;

  @Column({
    type: 'enum',
    enum: AppointmentOrigin,
    default: AppointmentOrigin.WEB,
    nullable: true,
  })
  origem: AppointmentOrigin;

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
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

  @ManyToOne(() => BarberEntity, (barber) => barber.appointments, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'barberId' })
  barber: BarberEntity;

  @ManyToOne(() => ProfileEntity, (profile) => profile.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clienteId' })
  cliente: ProfileEntity;
}
