import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BusinessEntity } from './business.entity';

export enum ReminderType {
  CONFIRMATION = 'CONFIRMATION',
  PRE_APPOINTMENT = 'PRE_APPOINTMENT',
  POST_APPOINTMENT = 'POST_APPOINTMENT',
  RESCHEDULING = 'RESCHEDULING',
}

@Entity('reminder_settings')
export class ReminderSettingsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  businessId: number;

  @ManyToOne(() => BusinessEntity, (business) => business.reminderSettings)
  business: BusinessEntity;

  @Column({ type: 'enum', enum: ReminderType })
  type: ReminderType;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'simple-array', default: [] })
  hoursBeforeAppointment: number[];

  @Column({ type: 'varchar', nullable: true })
  timezone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
