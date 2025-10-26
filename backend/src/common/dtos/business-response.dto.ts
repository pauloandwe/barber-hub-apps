export class WorkingHoursDto {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  breakStart?: string;
  breakEnd?: string;
  closed: boolean;
}

export class ServiceDto {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  active: boolean;
}

export class BarberDto {
  id: string;
  name: string;
  specialties: string[];
  active: boolean;
}

export class SettingsDto {
  reminderHours: number[];
  enableReminders: boolean;
  allowCancellation: boolean;
  cancellationDeadlineHours: number;
  allowReschedule: boolean;
  rescheduleDeadlineHours: number;
  autoConfirmAppointments: boolean;
}

export class BusinessDataDto {
  id: number;
  token: string;
  name: string;
  phone: string;
  type: string;
  workingHours: WorkingHoursDto[];
  services: ServiceDto[];
  barbers: BarberDto[];
  settings: SettingsDto;
}

export class BusinessResponseDto {
  data: {
    data: BusinessDataDto;
  };
}
