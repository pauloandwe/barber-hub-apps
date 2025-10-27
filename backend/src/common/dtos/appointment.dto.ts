import { IsString, IsNumber, IsDateString, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';
import { AppointmentOrigin } from 'src/database/entities';

export class CreateAppointmentDto {
  @IsNumber()
  @IsNotEmpty()
  businessId: number;

  @IsNumber()
  @IsNotEmpty()
  serviceId: number;

  @IsNumber()
  @IsNotEmpty()
  barberId: number;

  @IsNumber()
  @IsNotEmpty()
  clientId: number;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(AppointmentOrigin)
  @IsOptional()
  source?: AppointmentOrigin;
}

export class UpdateAppointmentDto {
  @IsNumber()
  @IsOptional()
  serviceId?: number;

  @IsNumber()
  @IsOptional()
  barberId?: number;

  @IsNumber()
  @IsOptional()
  clientId?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(AppointmentOrigin)
  @IsOptional()
  source?: AppointmentOrigin;
}

export class SuggestAppointmentDto {
  @IsNumber()
  @IsOptional()
  businessId?: number;

  @IsNumber()
  @IsOptional()
  serviceId?: number;

  @IsNumber()
  @IsOptional()
  barberId?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;
}

export class AppointmentResponseDto {
  id: number;
  businessId: number;
  serviceId: number;
  barberId: number;
  clientId: number;
  startDate: Date;
  endDate: Date;
  notes: string;
  source: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
