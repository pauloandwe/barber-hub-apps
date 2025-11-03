import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ReminderTemplateEntity, ReminderType } from '../../database/entities';
import { CreateReminderTemplateDto, UpdateReminderTemplateDto } from './dtos';

export const DEFAULT_TEMPLATES = {
  [ReminderType.CONFIRMATION]:
    'Olá {clientName}! Confirmamos seu agendamento para {appointmentDate} às {appointmentTime} com {professionalName}. Até lá! ✂️',
  [ReminderType.PRE_APPOINTMENT]:
    'Oi {clientName}! Lembrete: seu horário é {appointmentDate} às {appointmentTime} com {professionalName}. Confirme respondendo SIM.',
  [ReminderType.POST_APPOINTMENT]:
    'E aí {clientName}! Gostou do atendimento? Avalie-nos e agende seu próximo horário! 🌟',
  [ReminderType.RESCHEDULING]:
    'Sentimos sua falta, {clientName}! Que tal agendar um novo horário? Responda para marcar.',
};

@Injectable()
export class ReminderTemplateService {
  private readonly logger = new Logger(ReminderTemplateService.name);

  constructor(
    @InjectRepository(ReminderTemplateEntity)
    private reminderTemplateRepository: Repository<ReminderTemplateEntity>,
  ) {}

  async getOrCreateDefaultTemplates(businessId: number): Promise<ReminderTemplateEntity[]> {
    let templates = await this.reminderTemplateRepository.find({
      where: { businessId },
    });

    if (templates.length === 0) {
      const defaultTemplates = Object.entries(DEFAULT_TEMPLATES).map(([type, message]) =>
        this.reminderTemplateRepository.create({
          businessId,
          type: type as ReminderType,
          message,
          variables: this.extractVariables(message),
          active: true,
        }),
      );

      templates = await this.reminderTemplateRepository.save(defaultTemplates);
      this.logger.log(`Default reminder templates created for business ${businessId}`);
    }

    return templates;
  }

  async getTemplatesByType(
    businessId: number,
    type: ReminderType,
  ): Promise<ReminderTemplateEntity | null> {
    return this.reminderTemplateRepository.findOne({
      where: { businessId, type, active: true },
    });
  }

  async getAllTemplates(businessId: number): Promise<ReminderTemplateEntity[]> {
    return this.reminderTemplateRepository.find({
      where: { businessId },
      order: { type: 'ASC' },
    });
  }

  async getTemplate(id: number): Promise<ReminderTemplateEntity> {
    const template = await this.reminderTemplateRepository.findOneBy({ id });

    if (!template) {
      throw new NotFoundException(`Reminder template ${id} not found`);
    }

    return template;
  }

  async createTemplate(
    businessId: number,
    createDto: CreateReminderTemplateDto,
  ): Promise<ReminderTemplateEntity> {
    const template = this.reminderTemplateRepository.create({
      businessId,
      ...createDto,
      variables: this.extractVariables(createDto.message),
    });

    return this.reminderTemplateRepository.save(template);
  }

  async updateTemplate(
    id: number,
    updateDto: UpdateReminderTemplateDto,
  ): Promise<ReminderTemplateEntity> {
    const template = await this.reminderTemplateRepository.findOneBy({ id });

    if (!template) {
      throw new NotFoundException(`Reminder template ${id} not found`);
    }

    Object.assign(template, updateDto);
    if (updateDto.message) {
      template.variables = this.extractVariables(updateDto.message);
    }

    return this.reminderTemplateRepository.save(template);
  }

  async deleteTemplate(id: number): Promise<void> {
    const template = await this.reminderTemplateRepository.findOneBy({ id });

    if (!template) {
      throw new NotFoundException(`Reminder template ${id} not found`);
    }

    await this.reminderTemplateRepository.remove(template);
  }

  async resetTemplateToDefault(
    businessId: number,
    type: ReminderType,
  ): Promise<ReminderTemplateEntity> {
    const template = await this.reminderTemplateRepository.findOne({
      where: { businessId, type },
    });

    if (!template) {
      throw new NotFoundException(`Reminder template not found`);
    }

    template.message = DEFAULT_TEMPLATES[type];
    template.variables = this.extractVariables(template.message);

    return this.reminderTemplateRepository.save(template);
  }

  renderTemplate(template: ReminderTemplateEntity, variables: Record<string, string>): string {
    let message = template.message;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{${key}}`, 'g');
      message = message.replace(placeholder, value || '');
    });

    return message;
  }

  private extractVariables(message: string): string[] {
    const regex = /{(\w+)}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(message)) !== null) {
      variables.push(match[1]);
    }

    return [...new Set(variables)];
  }
}
