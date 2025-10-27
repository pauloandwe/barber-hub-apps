import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BusinessEntity } from './business.entity';

@Entity('working_hours')
export class WorkingHoursEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  businessId: number;

  @Column({ type: 'int' })
  dayOfWeek: number;

  @Column({ type: 'varchar', length: 5 })
  openTime: string;

  @Column({ type: 'varchar', length: 5 })
  closeTime: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  breakStart: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  breakEnd: string;

  @Column({ type: 'boolean', default: false })
  closed: boolean;

  @ManyToOne(() => BusinessEntity, (business) => business.workingHours, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: BusinessEntity;
}
