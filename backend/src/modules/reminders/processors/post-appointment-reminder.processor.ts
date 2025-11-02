import { Processor, OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
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

interface PostAppointmentReminderJob {
  appointmentId: number;
  logId: number;
}

@Processor(REMINDER_QUEUE_NAMES.POST_APPOINTMENT)
export class PostAppointmentReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(PostAppointmentReminderProcessor.name);
  private readonly whatsappServiceUrl = process.env.WHATSAPP_BOT_URL || 'http://localhost:3000';
  private readonly whatsappWebhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET || '';

  constructor(
    @InjectRepository(AppointmentEntity)
    private appointmentRepository: Repository<AppointmentEntity>,
    @InjectRepository(ReminderLogEntity)
    private reminderLogRepository: Repository<ReminderLogEntity>,
    @InjectRepository(ReminderTemplateEntity)
    private reminderTemplateRepository: Repository<ReminderTemplateEntity>,
    private reminderService: RemindersService,
  ) {
    super();
  }

  async process(job: Job<PostAppointmentReminderJob>) {
    return this.handlePostAppointmentReminder(job);
  }

  private async handlePostAppointmentReminder(job: Job<PostAppointmentReminderJob>) {
    const { appointmentId, logId } = job.data;

    this.logger.debug(
      `Processing post-appointment reminder for appointment ${appointmentId}`,
    );

    try {
      // Busca appointment com relacionamentos
      const appointment = await this.appointmentRepository.findOne({
        where: { id: appointmentId },
        relations: ['clientContact', 'barber', 'service', 'business'],
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

      // Não envia se não tiver cliente
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

      // Busca template de pós-agendamento
      const template = await this.reminderTemplateRepository.findOne({
        where: {
          businessId: appointment.businessId,
          type: ReminderType.POST_APPOINTMENT,
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

      // Renderiza mensagem com variáveis
      const message = this.renderMessage(template.message, {
        clientName: appointment.clientContact.name,
        appointmentDate: appointment.startDate.toLocaleDateString('pt-BR'),
        appointmentTime: appointment.startDate.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        barberName: appointment.barber?.name || 'Barbeiro',
        serviceName: appointment.service?.name || 'Serviço',
      });

      // Envia via WhatsApp
      const response = await this.sendReminderToWhatsApp({
        businessPhone: appointment.business.phone,
        clientPhone: appointment.clientContact.phone,
        message,
        appointmentId,
        type: 'POST_APPOINTMENT',
      });

      if (response.success && response.messageId) {
        this.logger.log(
          `Post-appointment reminder sent for appointment ${appointmentId}. Message ID: ${response.messageId}`,
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
        `Failed to send post-appointment reminder for appointment ${appointmentId}: ${error.message}`,
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
  onCompleted(job: Job<PostAppointmentReminderJob>) {
    this.logger.debug(
      `Post-appointment reminder job ${job.id} completed successfully`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<PostAppointmentReminderJob>, error: Error) {
    this.logger.error(
      `Post-appointment reminder job ${job.id} failed: ${error.message}`,
    );
  }
}
