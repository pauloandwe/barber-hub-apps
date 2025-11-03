import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { WorkingHoursEntity } from './working-hours.entity';
import { ServiceEntity } from './service.entity';
import { ProfessionalEntity } from './professional.entity';
import { SettingsEntity } from './settings.entity';
import { AppointmentEntity } from './appointment.entity';
import { ClientContactEntity } from './client-contact.entity';
import { ReminderSettingsEntity } from './reminder-settings.entity';
import { ReminderTemplateEntity } from './reminder-template.entity';

@Entity('businesses')
export class BusinessEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  token?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => WorkingHoursEntity, (workingHours) => workingHours.business, {
    cascade: true,
    eager: true,
  })
  workingHours: WorkingHoursEntity[];

  @OneToMany(() => ServiceEntity, (service) => service.business, {
    cascade: true,
    eager: true,
  })
  services: ServiceEntity[];

  @OneToMany(() => ProfessionalEntity, (professional) => professional.business, {
    cascade: true,
    eager: true,
  })
  professionals: ProfessionalEntity[];

  @OneToOne(() => SettingsEntity, (settings) => settings.business, {
    cascade: true,
    eager: true,
  })
  settings: SettingsEntity;

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.business)
  appointments: AppointmentEntity[];

  @OneToMany(() => ClientContactEntity, (contact) => contact.business)
  clientContacts: ClientContactEntity[];

  @OneToMany(
    () => ReminderSettingsEntity,
    (reminderSettings) => reminderSettings.business,
  )
  reminderSettings: ReminderSettingsEntity[];

  @OneToMany(
    () => ReminderTemplateEntity,
    (reminderTemplate) => reminderTemplate.business,
  )
  reminderTemplates: ReminderTemplateEntity[];
}
