import { Processor, OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import {
  AppointmentEntity,
  ReminderLogEntity,
  ReminderStatus,
  ReminderTemplateEntity,
  ReminderType,
} from '../../../database/entities';
import { RemindersService } from '../reminders.service';
import { REMINDER_QUEUE_NAMES } from '../../../config/bullmq.config';

interface PreAppointmentReminderJob {
  appointmentId: number;
  logId: number;
  hoursBeforeAppointment: number;
}

@Processor(REMINDER_QUEUE_NAMES.PRE_APPOINTMENT)
export class PreAppointmentReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(PreAppointmentReminderProcessor.name);
  private readonly whatsappServiceUrl: string;
  private readonly whatsappWebhookSecret: string;

  constructor(
    @InjectRepository(AppointmentEntity)
    private appointmentRepository: Repository<AppointmentEntity>,
    @InjectRepository(ReminderLogEntity)
    private reminderLogRepository: Repository<ReminderLogEntity>,
    @InjectRepository(ReminderTemplateEntity)
    private reminderTemplateRepository: Repository<ReminderTemplateEntity>,
    private reminderService: RemindersService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.whatsappServiceUrl =
      this.configService.get<string>('WHATSAPP_BOT_URL', 'http://localhost:3000') ?? 'http://localhost:3000';
    this.whatsappWebhookSecret = (this.configService.get<string>('WHATSAPP_WEBHOOK_SECRET') || '').trim();
  }

  async process(job: Job<PreAppointmentReminderJob>) {
    return this.handlePreAppointmentReminder(job);
  }

  private async handlePreAppointmentReminder(job: Job<PreAppointmentReminderJob>) {
    const { appointmentId, logId, hoursBeforeAppointment } = job.data;

    this.logger.debug(
      `Processing pre-appointment reminder for appointment ${appointmentId} (${hoursBeforeAppointment}h before)`,
    );

    try {
      
      const appointment = await this.appointmentRepository.findOne({
        where: { id: appointmentId },
        relations: ['clientContact', 'professional', 'service', 'business'],
      });

      if (!appointment) {
        this.logger.warn(`Appointment ${appointmentId} not found`);
        await this.reminderService.updateReminderLog(
          logId,
          ReminderStatus.FAILED,
          undefined,
          'Appointment not found',
        );
        return;
      }

      const now = new Date();
      if (appointment.startDate < now) {
        this.logger.warn(
          `Appointment ${appointmentId} is in the past, skipping reminder`,
        );
        await this.reminderService.updateReminderLog(
          logId,
          ReminderStatus.FAILED,
          undefined,
          'Appointment is in the past',
        );
        return;
      }

      if (!appointment.clientContact?.phone) {
        this.logger.warn(`No phone found for appointment ${appointmentId}`);
        await this.reminderService.updateReminderLog(
          logId,
          ReminderStatus.FAILED,
          undefined,
          'No client phone found',
        );
        return;
      }

      const template = await this.reminderTemplateRepository.findOne({
        where: {
          businessId: appointment.businessId,
          type: ReminderType.PRE_APPOINTMENT,
          active: true,
        },
      });

      if (!template) {
        this.logger.warn(`No template found for business ${appointment.businessId}`);
        await this.reminderService.updateReminderLog(
          logId,
          ReminderStatus.FAILED,
          undefined,
          'No template found',
        );
        return;
      }

      const message = this.renderMessage(template.message, {
        clientName: appointment.clientContact.name,
        appointmentDate: appointment.startDate.toLocaleDateString('pt-BR'),
        appointmentTime: appointment.startDate.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        professionalName: appointment.professional?.name || 'Profissional',
        serviceName: appointment.service?.name || 'Serviço',
      });

      const response = await this.sendReminderToWhatsApp({
        businessPhone: appointment.business.phone,
        clientPhone: appointment.clientContact.phone,
        message,
        appointmentId,
        type: 'PRE_APPOINTMENT',
      });

      if (response.success && response.messageId) {
        this.logger.log(
          `Pre-appointment reminder sent for appointment ${appointmentId}. Message ID: ${response.messageId}`,
        );
        await this.reminderService.updateReminderLog(
          logId,
          ReminderStatus.SENT,
          response.messageId,
        );
      } else {
        throw new Error(response.error || 'Failed to send reminder');
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to send pre-appointment reminder for appointment ${appointmentId}: ${error.message}`,
      );
      await this.reminderService.updateReminderLog(
        logId,
        ReminderStatus.FAILED,
        undefined,
        error.message,
      );
      throw error;
    }
  }

  private async sendReminderToWhatsApp(payload: any) {
    try {
      const authHeader = this.whatsappWebhookSecret
        ? `Bearer ${this.whatsappWebhookSecret}`
        : undefined;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authHeader) {
        headers.Authorization = authHeader;
        headers['X-Reminder-Token'] = authHeader;
      }

      const response = await axios.post(`${this.whatsappServiceUrl}/api/reminders/send`, payload, {
        headers,
        timeout: 15000,
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(
        `WhatsApp API error: ${error?.response?.status} - ${error?.response?.data?.error}`,
      );
      throw error;
    }
  }

  private renderMessage(template: string, variables: Record<string, string>): string {
    let message = template;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{${key}}`, 'g');
      message = message.replace(placeholder, value || '');
    });
    return message;
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<PreAppointmentReminderJob>) {
    this.logger.debug(
      `Pre-appointment reminder job ${job.id} completed successfully`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<PreAppointmentReminderJob>, error: Error) {
    this.logger.error(
      `Pre-appointment reminder job ${job.id} failed: ${error.message}`,
    );
  }
}
