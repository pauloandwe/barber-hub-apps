import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { REMINDER_QUEUE_NAMES } from '../../config/bullmq.config';
import {
  ReminderSettingsEntity,
  ReminderTemplateEntity,
  ReminderLogEntity,
  ClientPreferencesEntity,
  AppointmentEntity,
  BarberEntity,
  ServiceEntity,
  BusinessEntity,
  ClientContactEntity,
} from '../../database/entities';
import { RemindersService } from './reminders.service';
import { ReminderSettingsService } from './reminder-settings.service';
import { ReminderTemplateService } from './reminder-template.service';
import { ReminderAnalyticsService } from './reminder-analytics.service';
import { RemindersController } from './reminders.controller';
import { ConfirmationReminderProcessor } from './processors/confirmation-reminder.processor';
import { PreAppointmentReminderProcessor } from './processors/pre-appointment-reminder.processor';
import { PostAppointmentReminderProcessor } from './processors/post-appointment-reminder.processor';
import { ReschedulingReminderProcessor } from './processors/rescheduling-reminder.processor';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReminderSettingsEntity,
      ReminderTemplateEntity,
      ReminderLogEntity,
      ClientPreferencesEntity,
      AppointmentEntity,
      BarberEntity,
      ServiceEntity,
      BusinessEntity,
      ClientContactEntity,
    ]),
    BullModule.registerQueue(
      { name: REMINDER_QUEUE_NAMES.APPOINTMENT_CONFIRMATION },
      { name: REMINDER_QUEUE_NAMES.PRE_APPOINTMENT },
      { name: REMINDER_QUEUE_NAMES.POST_APPOINTMENT },
      { name: REMINDER_QUEUE_NAMES.RESCHEDULING },
    ),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'jwt-secret-key'),
        signOptions: {
          expiresIn: configService.get<string | number>('JWT_EXPIRATION', '24h') as any,
        },
      }),
    }),
  ],
  providers: [
    RemindersService,
    ReminderSettingsService,
    ReminderTemplateService,
    ReminderAnalyticsService,
    ConfirmationReminderProcessor,
    PreAppointmentReminderProcessor,
    PostAppointmentReminderProcessor,
    ReschedulingReminderProcessor,
    JwtAuthGuard,
  ],
  controllers: [RemindersController],
  exports: [
    RemindersService,
    ReminderSettingsService,
    ReminderTemplateService,
    ReminderAnalyticsService,
  ],
})
export class RemindersModule {}
