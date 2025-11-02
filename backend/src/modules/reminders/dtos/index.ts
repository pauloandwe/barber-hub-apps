import { IsEnum, IsBoolean, IsArray, IsNumber, IsString, IsOptional } from 'class-validator';
import { ReminderType } from '../../../database/entities';

export class CreateReminderSettingsDto {
  @IsEnum(ReminderType)
  type: ReminderType;

  @IsBoolean()
  enabled: boolean;

  @IsArray()
  @IsNumber({}, { each: true })
  hoursBeforeAppointment: number[];

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateReminderSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  hoursBeforeAppointment?: number[];

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class CreateReminderTemplateDto {
  @IsEnum(ReminderType)
  type: ReminderType;

  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateReminderTemplateDto {
  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export { CreateReminderSettingsDto as CreateReminderSettings };
export { UpdateReminderSettingsDto as UpdateReminderSettings };
export { CreateReminderTemplateDto as CreateReminderTemplate };
export { UpdateReminderTemplateDto as UpdateReminderTemplate };
