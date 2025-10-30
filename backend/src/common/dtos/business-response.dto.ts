export class ServiceDto {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
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
  services: ServiceDto[];
  settings: SettingsDto;
}

export class BusinessResponseDto {
  data: {
    data: BusinessDataDto;
  };
}
