import { Processor, OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import {
  ClientContactEntity,
  ReminderLogEntity,
  ReminderStatus,
  ReminderTemplateEntity,
  BusinessEntity,
  ReminderType,
} from '../../../database/entities';
import { RemindersService } from '../reminders.service';
import { REMINDER_QUEUE_NAMES } from '../../../config/bullmq.config';

interface ReschedulingReminderJob {
  appointmentId?: number;
  clientContactId: number;
  businessId: number;
  logId: number;
}

@Processor(REMINDER_QUEUE_NAMES.RESCHEDULING)
export class ReschedulingReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(ReschedulingReminderProcessor.name);
  private readonly whatsappServiceUrl: string;
  private readonly whatsappWebhookSecret: string;

  constructor(
    @InjectRepository(ClientContactEntity)
    private clientContactRepository: Repository<ClientContactEntity>,
    @InjectRepository(ReminderLogEntity)
    private reminderLogRepository: Repository<ReminderLogEntity>,
    @InjectRepository(ReminderTemplateEntity)
    private reminderTemplateRepository: Repository<ReminderTemplateEntity>,
    @InjectRepository(BusinessEntity)
    private businessRepository: Repository<BusinessEntity>,
    private reminderService: RemindersService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.whatsappServiceUrl =
      this.configService.get<string>('WHATSAPP_BOT_URL', 'http://localhost:3000') ?? 'http://localhost:3000';
    this.whatsappWebhookSecret = (this.configService.get<string>('WHATSAPP_WEBHOOK_SECRET') || '').trim();
  }

  async process(job: Job<ReschedulingReminderJob>) {
    return this.handleReschedulingReminder(job);
  }

  private async handleReschedulingReminder(job: Job<ReschedulingReminderJob>) {
    const { clientContactId, businessId, logId } = job.data;

    this.logger.debug(
      `Processing rescheduling reminder for client ${clientContactId} at business ${businessId}`,
    );

    try {
      const clientContact = await this.clientContactRepository.findOne({
        where: { id: clientContactId },
      });

      if (!clientContact) {
        this.logger.warn(`Client contact ${clientContactId} not found`);
        await this.reminderService.updateReminderLog(
          logId,
          ReminderStatus.FAILED,
          undefined,
          'Client contact not found',
        );
        return;
      }

      if (!clientContact.phone) {
        this.logger.warn(`No phone found for client contact ${clientContactId}`);
        await this.reminderService.updateReminderLog(
          logId,
          ReminderStatus.FAILED,
          undefined,
          'No client phone found',
        );
        return;
      }

      const business = await this.businessRepository.findOne({
        where: { id: businessId },
      });

      if (!business) {
        this.logger.warn(`Business ${businessId} not found`);
        await this.reminderService.updateReminderLog(
          logId,
          ReminderStatus.FAILED,
          undefined,
          'Business not found',
        );
        return;
      }

      const template = await this.reminderTemplateRepository.findOne({
        where: {
          businessId,
          type: ReminderType.RESCHEDULING,
          active: true,
        },
      });

      if (!template) {
        this.logger.warn(`No template found for business ${businessId}`);
        await this.reminderService.updateReminderLog(
          logId,
          ReminderStatus.FAILED,
          undefined,
          'No template found',
        );
        return;
      }

      const message = this.renderMessage(template.message, {
        clientName: clientContact.name,
        appointmentDate: 'em breve',
        appointmentTime: 'a agendar',
        professionalName: 'Nosso time',
        serviceName: 'Serviço',
      });

      const response = await this.sendReminderToWhatsApp({
        businessPhone: business.phone,
        clientPhone: clientContact.phone,
        message,
        clientContactId,
        type: 'RESCHEDULING',
      });

      if (response.success && response.messageId) {
        this.logger.log(
          `Rescheduling reminder sent for client ${clientContactId}. Message ID: ${response.messageId}`,
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
        `Failed to send rescheduling reminder for client ${clientContactId}: ${error.message}`,
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
  onCompleted(job: Job<ReschedulingReminderJob>) {
    this.logger.debug(`Rescheduling reminder job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ReschedulingReminderJob>, error: Error) {
    this.logger.error(`Rescheduling reminder job ${job.id} failed: ${error.message}`);
  }
}
