import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClientContactEntity } from './client-contact.entity';
import { ProfileEntity } from './profile.entity';

@Entity('client_preferences')
export class ClientPreferencesEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  clientContactId: number | null;

  @ManyToOne(() => ClientContactEntity, { nullable: true })
  clientContact: ClientContactEntity;

  @Column({ type: 'int', nullable: true })
  profileId: number | null;

  @ManyToOne(() => ProfileEntity, { nullable: true })
  profile: ProfileEntity;

  @Column({ type: 'boolean', default: true })
  remindersEnabled: boolean;

  @Column({ type: 'timestamp', nullable: true })
  optOutDate: Date;

  @Column({ type: 'varchar', default: 'pt-BR' })
  preferredLanguage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
