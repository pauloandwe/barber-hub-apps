import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { REMINDER_QUEUE_NAMES } from '../../config/bullmq.config';
import {
  ReminderSettingsEntity,
  ReminderLogEntity,
  ReminderType,
  ReminderStatus,
  AppointmentEntity,
} from '../../database/entities';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectRepository(ReminderLogEntity)
    private reminderLogRepository: Repository<ReminderLogEntity>,
    @InjectRepository(ReminderSettingsEntity)
    private reminderSettingsRepository: Repository<ReminderSettingsEntity>,
    @InjectRepository(AppointmentEntity)
    private appointmentRepository: Repository<AppointmentEntity>,
    @InjectQueue(REMINDER_QUEUE_NAMES.APPOINTMENT_CONFIRMATION)
    private appointmentConfirmationQueue: Queue,
    @InjectQueue(REMINDER_QUEUE_NAMES.PRE_APPOINTMENT)
    private preAppointmentQueue: Queue,
    @InjectQueue(REMINDER_QUEUE_NAMES.POST_APPOINTMENT)
    private postAppointmentQueue: Queue,
    @InjectQueue(REMINDER_QUEUE_NAMES.RESCHEDULING)
    private reschedulingQueue: Queue,
  ) {}

  async scheduleConfirmationReminder(appointmentId: number): Promise<void> {
    try {
      const appointment = await this.appointmentRepository.findOneBy({
        id: appointmentId,
      });

      if (!appointment) {
        this.logger.warn(`Appointment ${appointmentId} not found`);
        return;
      }

      const log = this.reminderLogRepository.create({
        appointmentId,
        clientContactId: appointment.clientContactId,
        type: ReminderType.CONFIRMATION,
        status: ReminderStatus.PENDING,
        scheduledAt: new Date(),
      });
      await this.reminderLogRepository.save(log);

      await this.appointmentConfirmationQueue.add(
        `confirmation-${appointmentId}`,
        {
          appointmentId,
          logId: log.id,
        },
        {
          delay: 1000,
        },
      );

      this.logger.debug(`Confirmation reminder scheduled for appointment ${appointmentId}`);
    } catch (error) {
      this.logger.error(`Failed to schedule confirmation reminder: ${error.message}`);
      throw error;
    }
  }

  async schedulePreAppointmentReminders(appointmentId: number): Promise<void> {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: appointmentId },
        relations: ['business', 'clientContact'],
      });

      if (!appointment) {
        this.logger.warn(`Appointment ${appointmentId} not found`);
        return;
      }

      if (!appointment.clientContactId) {
        this.logger.warn(
          `Appointment ${appointmentId} has no client contact. Skipping pre-appointment reminder.`,
        );
        return;
      }

      const settings = await this.reminderSettingsRepository.find({
        where: {
          businessId: appointment.businessId,
          type: ReminderType.PRE_APPOINTMENT,
          enabled: true,
        },
      });

      if (settings.length === 0) {
        this.logger.debug(
          `No pre-appointment settings found for business ${appointment.businessId}`,
        );
        return;
      }

      const appointmentTime = new Date(appointment.startDate).getTime();
      const setting = settings[0];

      for (const hoursBeforeAppointment of setting.hoursBeforeAppointment) {
        const now = new Date().getTime();
        const scheduleTime = appointmentTime - hoursBeforeAppointment * 60 * 60 * 1000;
        const delay = Math.max(0, scheduleTime - now);

        if (delay > 0) {
          const log = this.reminderLogRepository.create({
            appointmentId,
            clientContactId: appointment.clientContactId,
            type: ReminderType.PRE_APPOINTMENT,
            status: ReminderStatus.PENDING,
            scheduledAt: new Date(scheduleTime),
          });
          await this.reminderLogRepository.save(log);

          await this.preAppointmentQueue.add(
            `pre-appointment-${appointmentId}-${hoursBeforeAppointment}h`,
            {
              appointmentId,
              hoursBeforeAppointment,
              logId: log.id,
            },
            {
              delay,
            },
          );

          this.logger.debug(
            `Pre-appointment reminder scheduled for ${hoursBeforeAppointment}h before appointment ${appointmentId}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to schedule pre-appointment reminders: ${error.message}`);
      throw error;
    }
  }

  async schedulePostAppointmentReminder(appointmentId: number): Promise<void> {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: appointmentId },
        relations: ['business', 'clientContact'],
      });

      if (!appointment) {
        this.logger.warn(`Appointment ${appointmentId} not found`);
        return;
      }

      if (!appointment.clientContactId) {
        this.logger.warn(
          `Appointment ${appointmentId} has no client contact. Skipping post-appointment reminder.`,
        );
        return;
      }

      const settings = await this.reminderSettingsRepository.find({
        where: {
          businessId: appointment.businessId,
          type: ReminderType.POST_APPOINTMENT,
          enabled: true,
        },
      });

      if (settings.length === 0) {
        this.logger.debug(
          `No post-appointment settings found for business ${appointment.businessId}`,
        );
        return;
      }

      const log = this.reminderLogRepository.create({
        appointmentId,
        clientContactId: appointment.clientContactId,
        type: ReminderType.POST_APPOINTMENT,
        status: ReminderStatus.PENDING,
        scheduledAt: new Date(new Date().getTime() + 1 * 60 * 60 * 1000),
      });
      await this.reminderLogRepository.save(log);

      const delay = new Date(appointment.endDate).getTime() - new Date().getTime() + 60 * 60 * 1000;

      await this.postAppointmentQueue.add(
        `post-appointment-${appointmentId}`,
        {
          appointmentId,
          logId: log.id,
        },
        {
          delay: Math.max(0, delay),
        },
      );

      this.logger.debug(`Post-appointment reminder scheduled for appointment ${appointmentId}`);
    } catch (error) {
      this.logger.error(`Failed to schedule post-appointment reminder: ${error.message}`);
      throw error;
    }
  }

  async scheduleRescheduleReminder(
    appointmentId: number,
    daysAfterCancellation: number = 3,
  ): Promise<void> {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: appointmentId },
        relations: ['business', 'clientContact'],
      });

      if (!appointment) {
        this.logger.warn(`Appointment ${appointmentId} not found`);
        return;
      }

      if (!appointment.clientContactId) {
        this.logger.warn(
          `Appointment ${appointmentId} has no client contact. Skipping rescheduling reminder.`,
        );
        return;
      }

      const settings = await this.reminderSettingsRepository.find({
        where: {
          businessId: appointment.businessId,
          type: ReminderType.RESCHEDULING,
          enabled: true,
        },
      });

      if (settings.length === 0) {
        this.logger.debug(`No rescheduling settings found for business ${appointment.businessId}`);
        return;
      }

      const log = this.reminderLogRepository.create({
        appointmentId,
        clientContactId: appointment.clientContactId,
        type: ReminderType.RESCHEDULING,
        status: ReminderStatus.PENDING,
        scheduledAt: new Date(new Date().getTime() + daysAfterCancellation * 24 * 60 * 60 * 1000),
      });
      await this.reminderLogRepository.save(log);

      const delay = daysAfterCancellation * 24 * 60 * 60 * 1000;

      await this.reschedulingQueue.add(
        `rescheduling-${appointmentId}`,
        {
          appointmentId,
          businessId: appointment.businessId,
          clientContactId: appointment.clientContactId,
          logId: log.id,
        },
        {
          delay,
        },
      );

      this.logger.debug(
        `Rescheduling reminder scheduled for appointment ${appointmentId} in ${daysAfterCancellation} days`,
      );
    } catch (error) {
      this.logger.error(`Failed to schedule rescheduling reminder: ${error.message}`);
      throw error;
    }
  }

  async updateReminderLog(
    logId: number,
    status: ReminderStatus,
    messageId?: string,
    error?: string,
  ): Promise<void> {
    try {
      const log = await this.reminderLogRepository.findOneBy({ id: logId });
      if (!log) {
        this.logger.warn(`Reminder log ${logId} not found`);
        return;
      }

      log.status = status;
      if (messageId) log.messageId = messageId;
      if (error) log.error = error;
      if (status === ReminderStatus.SENT || status === ReminderStatus.DELIVERED) {
        log.sentAt = new Date();
      }

      await this.reminderLogRepository.save(log);
    } catch (error) {
      this.logger.error(`Failed to update reminder log: ${error.message}`);
    }
  }

  async resendReminder(logId: number): Promise<ReminderLogEntity> {
    try {
      const log = await this.reminderLogRepository.findOne({
        where: { id: logId },
        relations: ['appointment', 'clientContact'],
      });

      if (!log) {
        this.logger.warn(`Reminder log ${logId} not found`);
        throw new Error(`Reminder log ${logId} not found`);
      }

      if (log.status !== ReminderStatus.FAILED && log.status !== ReminderStatus.PENDING) {
        this.logger.warn(`Cannot resend reminder ${logId} with status ${log.status}`);
        throw new Error(
          `Cannot resend reminder with status ${log.status}. Only FAILED and PENDING reminders can be resent.`,
        );
      }

      let queue: Queue;
      switch (log.type) {
        case ReminderType.CONFIRMATION:
          queue = this.appointmentConfirmationQueue;
          break;
        case ReminderType.PRE_APPOINTMENT:
          queue = this.preAppointmentQueue;
          break;
        case ReminderType.POST_APPOINTMENT:
          queue = this.postAppointmentQueue;
          break;
        case ReminderType.RESCHEDULING:
          queue = this.reschedulingQueue;
          break;
        default:
          throw new Error(`Unknown reminder type: ${log.type}`);
      }

      const jobData = {
        appointmentId: log.appointmentId,
        logId: log.id,
        hoursBeforeAppointment: 0,
      };

      await queue.add(`${log.type.toLowerCase()}-${log.id}-resend`, jobData, {
        delay: 1000,
      });

      log.status = ReminderStatus.PENDING;
      log.error = null;
      log.sentAt = null;
      log.messageId = null;
      log.scheduledAt = new Date();
      await this.reminderLogRepository.save(log);

      this.logger.log(`Reminder ${logId} queued for resend. Type: ${log.type}`);

      return log;
    } catch (error) {
      this.logger.error(`Failed to resend reminder ${logId}: ${error.message}`);
      throw error;
    }
  }

  async getRemindersForBusiness(businessId: number): Promise<ReminderSettingsEntity[]> {
    return this.reminderSettingsRepository.find({
      where: { businessId },
    });
  }

  async getRemindersLog(
    businessId: number,
    skip: number = 0,
    take: number = 10,
  ): Promise<[ReminderLogEntity[], number]> {
    return this.reminderLogRepository.findAndCount({
      relations: ['appointment', 'clientContact'],
      where: {
        appointment: {
          businessId,
        },
      },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }
}
