import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BusinessEntity } from './business.entity';

@Entity('working_hours')
export class WorkingHoursEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  businessId: number;

  @Column({ type: 'int' })
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  @Column({ type: 'varchar', length: 5 })
  openTime: string; // Format: HH:MM

  @Column({ type: 'varchar', length: 5 })
  closeTime: string; // Format: HH:MM

  @Column({ type: 'varchar', length: 5, nullable: true })
  breakStart: string; // Format: HH:MM

  @Column({ type: 'varchar', length: 5, nullable: true })
  breakEnd: string; // Format: HH:MM

  @Column({ type: 'boolean', default: false })
  closed: boolean;

  // Relations
  @ManyToOne(() => BusinessEntity, (business) => business.workingHours, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: BusinessEntity;
}
