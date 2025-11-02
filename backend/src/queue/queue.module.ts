import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getBullmqConfig, REMINDER_QUEUE_NAMES } from '../config/bullmq.config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getBullmqConfig,
    }),
    BullModule.registerQueue(
      { name: REMINDER_QUEUE_NAMES.APPOINTMENT_CONFIRMATION },
      { name: REMINDER_QUEUE_NAMES.PRE_APPOINTMENT },
      { name: REMINDER_QUEUE_NAMES.POST_APPOINTMENT },
      { name: REMINDER_QUEUE_NAMES.RESCHEDULING },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
