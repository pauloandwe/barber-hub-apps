import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ReminderSettingsEntity, ReminderType } from '../../database/entities';
import { CreateReminderSettingsDto, UpdateReminderSettingsDto } from './dtos';

@Injectable()
export class ReminderSettingsService {
  private readonly logger = new Logger(ReminderSettingsService.name);

  constructor(
    @InjectRepository(ReminderSettingsEntity)
    private reminderSettingsRepository: Repository<ReminderSettingsEntity>,
  ) {}

  async getOrCreateDefaultSettings(businessId: number): Promise<ReminderSettingsEntity[]> {
    let settings = await this.reminderSettingsRepository.find({
      where: { businessId },
    });

    if (settings.length === 0) {
      const defaultSettings = [
        {
          businessId,
          type: ReminderType.CONFIRMATION,
          enabled: true,
          hoursBeforeAppointment: [],
          timezone: 'America/Sao_Paulo',
        },
        {
          businessId,
          type: ReminderType.PRE_APPOINTMENT,
          enabled: true,
          hoursBeforeAppointment: [24, 2],
          timezone: 'America/Sao_Paulo',
        },
        {
          businessId,
          type: ReminderType.POST_APPOINTMENT,
          enabled: true,
          hoursBeforeAppointment: [],
          timezone: 'America/Sao_Paulo',
        },
        {
          businessId,
          type: ReminderType.RESCHEDULING,
          enabled: true,
          hoursBeforeAppointment: [],
          timezone: 'America/Sao_Paulo',
        },
      ];

      settings = await this.reminderSettingsRepository.save(defaultSettings);
      this.logger.log(`Default reminder settings created for business ${businessId}`);
    }

    return settings;
  }

  async getSettingsByType(
    businessId: number,
    type: ReminderType,
  ): Promise<ReminderSettingsEntity | null> {
    return this.reminderSettingsRepository.findOne({
      where: { businessId, type },
    });
  }

  async getAllSettings(businessId: number): Promise<ReminderSettingsEntity[]> {
    return this.reminderSettingsRepository.find({
      where: { businessId },
      order: { type: 'ASC' },
    });
  }

  async createSetting(
    businessId: number,
    createDto: CreateReminderSettingsDto,
  ): Promise<ReminderSettingsEntity> {
    const existingSetting = await this.reminderSettingsRepository.findOne({
      where: { businessId, type: createDto.type },
    });

    if (existingSetting) {
      return this.updateSetting(existingSetting.id, createDto);
    }

    const setting = this.reminderSettingsRepository.create({
      businessId,
      ...createDto,
      timezone: createDto.timezone || 'America/Sao_Paulo',
    });

    return this.reminderSettingsRepository.save(setting);
  }

  async updateSetting(
    id: number,
    updateDto: UpdateReminderSettingsDto,
  ): Promise<ReminderSettingsEntity> {
    const setting = await this.reminderSettingsRepository.findOneBy({ id });

    if (!setting) {
      throw new NotFoundException(`Reminder setting ${id} not found`);
    }

    Object.assign(setting, updateDto);
    return this.reminderSettingsRepository.save(setting);
  }

  async toggleSetting(id: number): Promise<ReminderSettingsEntity> {
    const setting = await this.reminderSettingsRepository.findOneBy({ id });

    if (!setting) {
      throw new NotFoundException(`Reminder setting ${id} not found`);
    }

    setting.enabled = !setting.enabled;
    return this.reminderSettingsRepository.save(setting);
  }

  async deleteSetting(id: number): Promise<void> {
    const setting = await this.reminderSettingsRepository.findOneBy({ id });

    if (!setting) {
      throw new NotFoundException(`Reminder setting ${id} not found`);
    }

    await this.reminderSettingsRepository.remove(setting);
  }
}
