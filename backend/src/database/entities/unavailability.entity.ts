import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ProfessionalEntity } from './professional.entity';

@Entity('unavailability')
export class UnavailabilityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  professional_id: number;

  @Column({ type: 'timestamp with time zone' })
  data_inicio: Date;

  @Column({ type: 'timestamp with time zone' })
  data_fim: Date;

  @Column({ type: 'text', nullable: true })
  motivo: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => ProfessionalEntity, (professional) => professional.unavailability, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'professional_id' })
  professional: ProfessionalEntity;
}
