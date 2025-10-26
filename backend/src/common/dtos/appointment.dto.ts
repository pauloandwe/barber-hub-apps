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
  clienteId: number;

  @IsDateString()
  @IsNotEmpty()
  data_inicio: string; // ISO 8601 timestamp

  @IsDateString()
  @IsNotEmpty()
  data_fim: string; // ISO 8601 timestamp

  @IsString()
  @IsOptional()
  observacoes?: string;

  @IsEnum(AppointmentOrigin)
  @IsOptional()
  origem?: AppointmentOrigin;
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
  clienteId?: number;

  @IsDateString()
  @IsOptional()
  data_inicio?: string;

  @IsDateString()
  @IsOptional()
  data_fim?: string;

  @IsString()
  @IsOptional()
  observacoes?: string;

  @IsEnum(AppointmentOrigin)
  @IsOptional()
  origem?: AppointmentOrigin;
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
  data_inicio?: string;
}

export class AppointmentResponseDto {
  id: number;
  businessId: number;
  serviceId: number;
  barberId: number;
  clienteId: number;
  data_inicio: Date;
  data_fim: Date;
  observacoes: string;
  origem: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
