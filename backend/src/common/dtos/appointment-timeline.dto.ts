import { AppointmentStatus } from 'src/database/entities';

class AppointmentTimelineClientContactDto {
  name: string | null;
  phone: string;
}

class AppointmentTimelineServiceDto {
  name: string;
  duration: number;
  price: number;
}

export class AppointmentTimelineCardDto {
  id: number;
  professionalId: number;
  startDate: string;
  endDate: string;
  status: AppointmentStatus;
  notes: string | null;
  source: 'web' | 'whatsapp' | null;
  clientContact: AppointmentTimelineClientContactDto;
  service: AppointmentTimelineServiceDto;
}

export class ProfessionalWorkingHourDto {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  closed: boolean;
}

export class ProfessionalTimelineDto {
  id: number;
  name: string;
  specialties: string[];
  appointments: AppointmentTimelineCardDto[];
  workingHours: ProfessionalWorkingHourDto;
}

export class AppointmentTimelineResponseDto {
  date: string;
  professionals: ProfessionalTimelineDto[];
  slotDurationMinutes: number;
}

export class AppointmentTimelineQueryDto {
  date: string;
  professionalIds?: number[];
  status?: 'pending' | 'confirmed' | 'canceled';
  serviceId?: number;
}
