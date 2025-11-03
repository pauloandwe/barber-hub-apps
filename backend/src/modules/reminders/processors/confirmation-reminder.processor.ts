import { Processor, OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosError } from 'axios';
import {
  AppointmentEntity,
  ReminderLogEntity,
  ReminderStatus,
  ReminderTemplateEntity,
  ReminderType,
} from '../../../database/entities';
import { RemindersService } from '../reminders.service';
import { REMINDER_QUEUE_NAMES } from '../../../config/bullmq.config';

interface ConfirmationReminderJob {
  appointmentId: number;
  logId: number;
}

interface WhatsAppReminderPayload {
  businessPhone: string;
  clientPhone: string;
  message: string;
  appointmentId: number;
  type: ReminderType;
}

@Processor(REMINDER_QUEUE_NAMES.APPOINTMENT_CONFIRMATION)
export class ConfirmationReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(ConfirmationReminderProcessor.name);
  private readonly whatsappServiceUrl = process.env.WHATSAPP_BOT_URL || 'http://localhost:3000';
  private readonly whatsappWebhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET || '';
  private loggedMissingSecret = false;

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

  async process(job: Job<ConfirmationReminderJob>) {
    const { appointmentId, logId } = job.data;

    this.logger.debug(`Processing confirmation reminder for appointment ${appointmentId}`);

    if (!this.whatsappWebhookSecret && !this.loggedMissingSecret) {
      this.logger.warn(
        'WhatsApp webhook secret is not configured; requests may be rejected with 401 Unauthorized.',
      );
      this.loggedMissingSecret = true;
    }

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
          type: ReminderType.CONFIRMATION,
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

      const whatsappPayload: WhatsAppReminderPayload = {
        businessPhone: appointment.business.phone,
        clientPhone: appointment.clientContact.phone,
        message,
        appointmentId,
        type: ReminderType.CONFIRMATION,
      };

      this.logger.debug(
        `Prepared WhatsApp confirmation reminder payload: ${this.safeStringify(
          this.getPayloadDebugInfo(whatsappPayload),
        )}`,
      );

      const response = await this.sendReminderToWhatsApp(whatsappPayload);

      if (response.success && response.messageId) {
        this.logger.log(
          `Confirmation reminder sent for appointment ${appointmentId}. Message ID: ${response.messageId}`,
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
        `Failed to send confirmation reminder for appointment ${appointmentId}: ${error.message}`,
        error?.stack,
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

  private async sendReminderToWhatsApp(payload: WhatsAppReminderPayload) {
    const url = `${this.whatsappServiceUrl}/api/reminders/send`;
    const payloadDebugInfo = this.getPayloadDebugInfo(payload);

    this.logger.debug(
      `Sending WhatsApp reminder request: ${this.safeStringify({
        url,
        payload: payloadDebugInfo,
        tokenConfigured: Boolean(this.whatsappWebhookSecret),
        tokenLength: this.whatsappWebhookSecret ? this.whatsappWebhookSecret.length : 0,
        timeoutMs: 15000,
      })}`,
    );

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

    try {
      const response = await axios.post(url, payload, {
        headers,
        timeout: 15000,
      });

      this.logger.debug(
        `WhatsApp API response: ${this.safeStringify({
          status: response.status,
          data: response.data,
        })}`,
      );

      return response.data;
    } catch (error: any) {
      this.logWhatsAppError(error, url, payloadDebugInfo);
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
  onCompleted(job: Job<ConfirmationReminderJob>) {
    this.logger.debug(`Confirmation reminder job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ConfirmationReminderJob>, error: Error) {
    this.logger.error(`Confirmation reminder job ${job.id} failed: ${error.message}`);
  }

  private logWhatsAppError(
    error: unknown,
    requestUrl: string,
    payloadDebugInfo: Record<string, unknown>,
  ) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status ?? 'NO_STATUS';

      this.logger.error(
        `WhatsApp API error: status=${status}, code=${axiosError.code || 'N/A'}, message=${
          axiosError.message
        }`,
      );

      if (axiosError.response?.data) {
        this.logger.error(
          `WhatsApp API response data: ${this.safeStringify(axiosError.response.data)}`,
        );
      }

      if (axiosError.response?.headers) {
        this.logger.debug(
          `WhatsApp API response headers: ${this.safeStringify(axiosError.response.headers)}`,
        );
      }

      this.logger.debug(
        `WhatsApp API request config: ${this.safeStringify({
          url: axiosError.config?.url || requestUrl,
          method: axiosError.config?.method,
          timeout: axiosError.config?.timeout,
          headers: this.sanitizeHeaders(axiosError.config?.headers),
        })}`,
      );

      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        this.logger.warn(
          `Unauthorized response when calling WhatsApp API. Payload summary: ${this.safeStringify(
            payloadDebugInfo,
          )}`,
        );
        this.logger.warn(
          `Token configured: ${Boolean(this.whatsappWebhookSecret)} (length=${
            this.whatsappWebhookSecret?.length || 0
          })`,
        );
      }

      if (axiosError.request && !axiosError.response) {
        this.logger.error('WhatsApp API request sent but no response received.');
      }
    } else {
      const genericError = error as Error;
      this.logger.error(
        `Unexpected error when calling WhatsApp API: ${genericError?.message || 'Unknown error'}`,
        genericError?.stack,
      );
    }
  }

  private sanitizeHeaders(headers: unknown) {
    if (!headers) {
      return undefined;
    }

    let sanitizedHeaders: Record<string, unknown>;

    if (typeof headers !== 'object') {
      return headers;
    }

    try {
      sanitizedHeaders = JSON.parse(JSON.stringify(headers));
    } catch {
      sanitizedHeaders = { ...(headers as Record<string, unknown>) };
    }

    Object.keys(sanitizedHeaders).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'x-reminder-token' || lowerKey === 'authorization') {
        sanitizedHeaders[key] = '[REDACTED]';
      }
    });

    return sanitizedHeaders;
  }

  private getPayloadDebugInfo(payload: WhatsAppReminderPayload) {
    return {
      appointmentId: payload.appointmentId,
      businessPhone: payload.businessPhone,
      clientPhone: payload.clientPhone,
      messageLength: payload.message.length,
      messagePreview: payload.message.slice(0, 120),
      type: payload.type,
    };
  }

  private safeStringify(value: unknown, maxLength = 2000) {
    try {
      const serialized = JSON.stringify(value);
      if (serialized.length > maxLength) {
        return `${serialized.slice(0, maxLength)}... [truncated]`;
      }
      return serialized;
    } catch (serializationError) {
      return `[Unserializable value: ${(serializationError as Error).message}]`;
    }
  }
}
