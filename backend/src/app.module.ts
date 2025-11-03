import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { UnavailabilityModule } from './modules/unavailability/unavailability.module';
import { UsersModule } from './modules/users/users.module';
import { BusinessModule } from './modules/business/business.module';
import { ProfessionalsModule } from './modules/professionals/professionals.module';
import { ServicesModule } from './modules/services/services.module';
import { getDatabaseConfig } from './config/database.config';
import {
  BusinessEntity,
  WorkingHoursEntity,
  ServiceEntity,
  ProfessionalEntity,
  SettingsEntity,
  AppointmentEntity,
  ProfileEntity,
  UnavailabilityEntity,
  ProfessionalWorkingHoursEntity,
  ReminderSettingsEntity,
  ReminderTemplateEntity,
  ReminderLogEntity,
  ClientPreferencesEntity,
} from './database/entities';
import { ProfessionalWorkingHoursModule } from './modules/professional-working-hours/professional-working-hours.module';
import { QueueModule } from './queue/queue.module';
import { RemindersModule } from './modules/reminders/reminders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    TypeOrmModule.forFeature([
      BusinessEntity,
      WorkingHoursEntity,
      ServiceEntity,
      ProfessionalEntity,
      SettingsEntity,
      AppointmentEntity,
      ProfileEntity,
      UnavailabilityEntity,
      ProfessionalWorkingHoursEntity,
      ReminderSettingsEntity,
      ReminderTemplateEntity,
      ReminderLogEntity,
      ClientPreferencesEntity,
    ]),
    QueueModule,
    RemindersModule,
    AuthModule,
    AppointmentsModule,
    UnavailabilityModule,
    UsersModule,
    BusinessModule,
    ProfessionalsModule,
    ServicesModule,
    ProfessionalWorkingHoursModule,
  ],
})
export class AppModule {}
