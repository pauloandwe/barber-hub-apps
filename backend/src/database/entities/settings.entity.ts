import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { BusinessEntity } from './business.entity';

@Entity('settings')
export class SettingsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  businessId: number;

  @Column({ type: 'simple-array', default: '24,2' })
  reminderHours?: string[]; // Will be stored and retrieved as string array

  @Column({ type: 'boolean', default: true })
  enableReminders: boolean;

  @Column({ type: 'boolean', default: true })
  allowCancellation: boolean;

  @Column({ type: 'int', default: 2 })
  cancellationDeadlineHours: number;

  @Column({ type: 'boolean', default: true })
  allowReschedule: boolean;

  @Column({ type: 'int', default: 2 })
  rescheduleDeadlineHours: number;

  @Column({ type: 'boolean', default: true })
  autoConfirmAppointments: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => BusinessEntity, (business) => business.settings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: BusinessEntity;
}
