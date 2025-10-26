import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BusinessEntity } from './business.entity';
import { AppointmentEntity } from './appointment.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  BARBEARIA = 'BARBEARIA',
  CLIENTE = 'CLIENTE',
}

@Entity('profiles')
export class ProfileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefone: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENTE,
  })
  role: UserRole;

  @Column({ type: 'int', nullable: true })
  barbearia_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => BusinessEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'barbearia_id' })
  barbearia: BusinessEntity;

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.cliente)
  appointments: AppointmentEntity[];
}
