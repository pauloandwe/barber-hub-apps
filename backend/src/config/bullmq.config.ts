import { BullRootModuleOptions } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

export const getBullmqConfig = (
  configService: ConfigService,
): BullRootModuleOptions => ({
  connection: {
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const REMINDER_QUEUE_NAMES = {
  APPOINTMENT_CONFIRMATION: 'appointment-confirmation',
  PRE_APPOINTMENT: 'pre-appointment',
  POST_APPOINTMENT: 'post-appointment',
  RESCHEDULING: 'rescheduling',
} as const;
