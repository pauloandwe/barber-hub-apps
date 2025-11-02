import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { AppointmentEntity } from './appointment.entity';
import { ClientContactEntity } from './client-contact.entity';
import { ReminderType } from './reminder-settings.entity';

export enum ReminderStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

@Entity('reminder_logs')
export class ReminderLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  appointmentId: number | null;

  @ManyToOne(() => AppointmentEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'appointmentId' })
  appointment: AppointmentEntity;

  @Column({ type: 'int', nullable: true })
  clientContactId: number | null;

  @ManyToOne(() => ClientContactEntity, { nullable: true })
  clientContact: ClientContactEntity;

  @Column({ type: 'enum', enum: ReminderType })
  type: ReminderType;

  @Column({ type: 'enum', enum: ReminderStatus, default: ReminderStatus.PENDING })
  status: ReminderStatus;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'varchar', nullable: true })
  messageId: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'text', nullable: true })
  error: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
