import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BusinessEntity } from './business.entity';
import { AppointmentEntity } from './appointment.entity';

@Entity('client_contacts')
@Index(['businessId', 'phone'], { unique: true })
export class ClientContactEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  businessId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => BusinessEntity, (business) => business.clientContacts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: BusinessEntity;

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.clientContact)
  appointments: AppointmentEntity[];
}
