import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BarberEntity } from './barber.entity';

@Entity('barber_working_hours')
@Unique(['barberId', 'dayOfWeek'])
export class BarberWorkingHoursEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  barberId: number;

  @Column({ type: 'int' })
  dayOfWeek: number;

  @Column({ type: 'varchar', length: 5, nullable: true })
  openTime: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  closeTime: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  breakStart: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  breakEnd: string | null;

  @Column({ type: 'boolean', default: false })
  closed: boolean;

  @ManyToOne(() => BarberEntity, (barber) => barber.workingHours, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'barberId' })
  barber: BarberEntity;
}

