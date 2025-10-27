import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { BarberEntity } from './barber.entity';

@Entity('bloqueios')
export class BloqueioEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  barbeiro_id: number;

  @Column({ type: 'timestamp with time zone' })
  data_inicio: Date;

  @Column({ type: 'timestamp with time zone' })
  data_fim: Date;

  @Column({ type: 'text', nullable: true })
  motivo: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => BarberEntity, (barber) => barber.bloqueios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'barbeiro_id' })
  barbeiro: BarberEntity;
}
