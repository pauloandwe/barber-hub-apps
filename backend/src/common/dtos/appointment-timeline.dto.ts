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
  barberId: number;
  startDate: string;
  endDate: string;
  status: AppointmentStatus;
  notes: string | null;
  source: 'web' | 'whatsapp' | null;
  clientContact: AppointmentTimelineClientContactDto;
  service: AppointmentTimelineServiceDto;
}

export class BarberWorkingHourDto {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  closed: boolean;
}

export class BarberTimelineDto {
  id: number;
  name: string;
  specialties: string[];
  appointments: AppointmentTimelineCardDto[];
  workingHours: BarberWorkingHourDto;
}

export class AppointmentTimelineResponseDto {
  date: string;
  barbers: BarberTimelineDto[];
  slotDurationMinutes: number;
}

export class AppointmentTimelineQueryDto {
  date: string;
  barberIds?: number[];
  status?: 'pending' | 'confirmed' | 'canceled';
  serviceId?: number;
}
