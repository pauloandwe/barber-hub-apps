import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import {
  BusinessEntity,
  ServiceEntity,
  BarberEntity,
  AppointmentEntity,
  AppointmentStatus,
  WorkingHoursEntity,
  BarberWorkingHoursEntity,
} from '../../database/entities';
import { CreateBusinessDto } from '../../common/dtos/create-business.dto';
import { UpdateBusinessDto } from '../../common/dtos/update-business.dto';

type TimeInterval = {
  start: Date;
  end: Date;
};

export interface BarberAvailability {
  id: number;
  name: string;
  specialties: string[] | null;
  slots: Array<{ start: string; end: string }>;
}

export interface AvailabilityResponse {
  date: string;
  slotDurationMinutes: number;
  barbers: BarberAvailability[];
}

export interface SingleBarberAvailabilityResponse {
  date: string;
  slotDurationMinutes: number;
  barber: BarberAvailability;
}

type WorkingHoursLike = Pick<
  WorkingHoursEntity,
  'openTime' | 'closeTime' | 'breakStart' | 'breakEnd'
> & { closed?: boolean };

const DEFAULT_SLOT_DURATION_MINUTES = 30;

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(BusinessEntity)
    private readonly businessRepository: Repository<BusinessEntity>,
    @InjectRepository(ServiceEntity)
    private readonly serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(BarberEntity)
    private readonly barberRepository: Repository<BarberEntity>,
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
  ) {}

  async findAll(): Promise<BusinessEntity[]> {
    return this.businessRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: number): Promise<BusinessEntity> {
    return this.businessRepository.findOne({
      where: { id },
    });
  }

  async findByPhone(phone: string): Promise<BusinessEntity> {
    return this.businessRepository.findOne({
      where: { phone },
    });
  }

  async findServicesByPhone(phone: string): Promise<ServiceEntity[]> {
    const business = await this.getBusinessByPhoneOrThrow(phone);

    return this.serviceRepository.find({
      where: { businessId: business.id },
      order: { name: 'ASC' },
    });
  }

  async findBarbersByPhone(phone: string): Promise<BarberEntity[]> {
    const business = await this.getBusinessByPhoneOrThrow(phone);

    return this.barberRepository.find({
      where: { businessId: business.id, active: true },
      order: { name: 'ASC' },
    });
  }

  async findAvailableSlotsByPhone(
    phone: string,
    options: { date?: string; serviceId?: number } = {},
  ): Promise<AvailabilityResponse> {
    const { date, serviceId } = options;
    const business = await this.getBusinessByPhoneOrThrow(phone, ['workingHours']);
    const targetDate = this.resolveTargetDate(date);
    const startOfDay = new Date(targetDate);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const slotDurationMinutes = await this.resolveSlotDuration(serviceId, business.id);

    const barbers = await this.barberRepository.find({
      where: { businessId: business.id, active: true },
      relations: ['bloqueios', 'workingHours'],
      order: { name: 'ASC' },
    });

    if (!barbers.length) {
      return {
        date: this.formatDate(startOfDay),
        slotDurationMinutes,
        barbers: [],
      };
    }

    const dayOfWeek = startOfDay.getDay();
    const businessWorkingDay = business.workingHours?.find(
      (wh) => wh.dayOfWeek === dayOfWeek,
    );

    const barberIds = barbers.map((barber) => barber.id);

    const appointments = barberIds.length
      ? await this.appointmentRepository.find({
          where: {
            businessId: business.id,
            barberId: In(barberIds),
            startDate: Between(startOfDay, endOfDay),
            status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
          },
        })
      : [];

    const appointmentsByBarber = appointments.reduce<Map<number, AppointmentEntity[]>>(
      (acc, appointment) => {
        const list = acc.get(appointment.barberId) ?? [];
        list.push(appointment);
        acc.set(appointment.barberId, list);
        return acc;
      },
      new Map(),
    );

    const availability: BarberAvailability[] = barbers.map((barber) =>
      this.calculateAvailabilityForBarber({
        barber,
        businessWorkingDay: businessWorkingDay ?? null,
        dayOfWeek,
        startOfDay,
        endOfDay,
        slotDurationMinutes,
        appointments: appointmentsByBarber.get(barber.id) ?? [],
      }),
    );

    return {
      date: this.formatDate(startOfDay),
      slotDurationMinutes,
      barbers: availability,
    };
  }

  async findBarberSlotsByPhone(
    phone: string,
    barberId: number,
    options: { date?: string; serviceId?: number } = {},
  ): Promise<SingleBarberAvailabilityResponse> {
    const { date, serviceId } = options;
    const business = await this.getBusinessByPhoneOrThrow(phone, ['workingHours']);
    const targetDate = this.resolveTargetDate(date);
    const startOfDay = new Date(targetDate);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const slotDurationMinutes = await this.resolveSlotDuration(serviceId, business.id);

    const barber = await this.barberRepository.findOne({
      where: { id: barberId, businessId: business.id, active: true },
      relations: ['bloqueios', 'workingHours'],
    });

    if (!barber) {
      throw new NotFoundException('Barber not found for this business');
    }

    const dayOfWeek = startOfDay.getDay();
    const businessWorkingDay = business.workingHours?.find(
      (wh) => wh.dayOfWeek === dayOfWeek,
    );

    const appointments = await this.appointmentRepository.find({
      where: {
        businessId: business.id,
        barberId: barber.id,
        startDate: Between(startOfDay, endOfDay),
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
      },
    });

    const barberAvailability = this.calculateAvailabilityForBarber({
      barber,
      businessWorkingDay: businessWorkingDay ?? null,
      dayOfWeek,
      startOfDay,
      endOfDay,
      slotDurationMinutes,
      appointments,
    });

    return {
      date: this.formatDate(startOfDay),
      slotDurationMinutes,
      barber: barberAvailability,
    };
  }

  async create(createBusinessDto: CreateBusinessDto): Promise<BusinessEntity> {
    if (!createBusinessDto.token) {
      createBusinessDto.token = this.generateToken();
    }
    const business = this.businessRepository.create(createBusinessDto);
    return this.businessRepository.save(business);
  }

  private generateToken(): string {
    return (
      'TOKEN_' +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  async update(id: number, updateBusinessDto: UpdateBusinessDto): Promise<BusinessEntity> {
    await this.businessRepository.update(id, updateBusinessDto);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.businessRepository.delete(id);
  }

  private async getBusinessByPhoneOrThrow(
    phone: string,
    relations: string[] = [],
  ): Promise<BusinessEntity> {
    const business = await this.businessRepository.findOne({
      where: { phone },
      relations,
    });

    if (!business) {
      throw new NotFoundException('Business not found for the provided phone number');
    }

    return business;
  }

  private resolveTargetDate(date?: string): Date {
    if (!date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const [year, month, day] = date.split('-').map(Number);
    const parsed = new Date(year, (month ?? 0) - 1, day);
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }

  private async resolveSlotDuration(
    serviceId: number | undefined,
    businessId: number,
  ): Promise<number> {
    if (!serviceId) {
      return DEFAULT_SLOT_DURATION_MINUTES;
    }

    const service = await this.serviceRepository.findOne({
      where: { id: serviceId, businessId },
    });

    if (!service) {
      throw new NotFoundException('Service not found for this business');
    }

    if (!service.duration || service.duration <= 0) {
      throw new BadRequestException('Service duration must be greater than zero');
    }

    return service.duration;
  }

  private calculateAvailabilityForBarber({
    barber,
    businessWorkingDay,
    dayOfWeek,
    startOfDay,
    endOfDay,
    slotDurationMinutes,
    appointments,
  }: {
    barber: BarberEntity;
    businessWorkingDay: WorkingHoursEntity | null;
    dayOfWeek: number;
    startOfDay: Date;
    endOfDay: Date;
    slotDurationMinutes: number;
    appointments: AppointmentEntity[];
  }): BarberAvailability {
    const workingDay = this.resolveWorkingHoursForBarber(
      barber.workingHours ?? [],
      businessWorkingDay,
      dayOfWeek,
    );

    if (!workingDay) {
      return {
        id: barber.id,
        name: barber.name,
        specialties: barber.specialties ?? null,
        slots: [],
      };
    }

    const baseIntervals = this.buildBaseIntervals(startOfDay, workingDay);

    if (!baseIntervals.length) {
      return {
        id: barber.id,
        name: barber.name,
        specialties: barber.specialties ?? null,
        slots: [],
      };
    }

    let availableIntervals = this.cloneIntervals(baseIntervals);

    for (const appointment of appointments ?? []) {
      const busyInterval = this.clampInterval(
        { start: appointment.startDate, end: appointment.endDate },
        startOfDay,
        endOfDay,
      );
      if (busyInterval) {
        availableIntervals = this.subtractInterval(availableIntervals, busyInterval);
      }
    }

    const bloqueios = barber.bloqueios ?? [];
    for (const bloqueio of bloqueios) {
      const blockedInterval = this.clampInterval(
        { start: bloqueio.data_inicio, end: bloqueio.data_fim },
        startOfDay,
        endOfDay,
      );
      if (blockedInterval) {
        availableIntervals = this.subtractInterval(availableIntervals, blockedInterval);
      }
    }

    const slots = this.splitIntoSlots(availableIntervals, slotDurationMinutes);
    const futureSlots = this.filterPastSlots(slots, startOfDay).map((slot) => ({
      start: this.formatTime(slot.start),
      end: this.formatTime(slot.end),
    }));

    return {
      id: barber.id,
      name: barber.name,
      specialties: barber.specialties ?? null,
      slots: futureSlots,
    };
  }

  private resolveWorkingHoursForBarber(
    barberWorkingHours: BarberWorkingHoursEntity[],
    businessWorkingDay: WorkingHoursEntity | null,
    dayOfWeek: number,
  ): WorkingHoursLike | null {
    const barberDay = barberWorkingHours.find((wh) => wh.dayOfWeek === dayOfWeek);

    if (barberDay) {
      if (barberDay.closed) {
        return null;
      }

      if (!barberDay.openTime || !barberDay.closeTime) {
        return null;
      }

      return {
        openTime: barberDay.openTime,
        closeTime: barberDay.closeTime,
        breakStart: barberDay.breakStart ?? undefined,
        breakEnd: barberDay.breakEnd ?? undefined,
        closed: barberDay.closed,
      };
    }

    if (!businessWorkingDay || businessWorkingDay.closed) {
      return null;
    }

    return businessWorkingDay;
  }

  private buildBaseIntervals(date: Date, workingDay: WorkingHoursLike): TimeInterval[] {
    if (!workingDay.openTime || !workingDay.closeTime) {
      return [];
    }

    const open = this.combineDateTime(date, workingDay.openTime);
    const close = this.combineDateTime(date, workingDay.closeTime);

    if (close <= open) {
      return [];
    }

    const intervals: TimeInterval[] = [];

    if (workingDay.breakStart && workingDay.breakEnd) {
      const breakStart = this.combineDateTime(date, workingDay.breakStart);
      const breakEnd = this.combineDateTime(date, workingDay.breakEnd);

      if (breakStart > open) {
        intervals.push({
          start: new Date(open),
          end: new Date(Math.min(breakStart.getTime(), close.getTime())),
        });
      }

      if (breakEnd < close) {
        intervals.push({
          start: new Date(Math.max(breakEnd.getTime(), open.getTime())),
          end: new Date(close),
        });
      }
    }

    if (!intervals.length) {
      intervals.push({ start: open, end: close });
    }

    return intervals.filter((interval) => interval.end > interval.start);
  }

  private cloneIntervals(intervals: TimeInterval[]): TimeInterval[] {
    return intervals.map((interval) => ({
      start: new Date(interval.start),
      end: new Date(interval.end),
    }));
  }

  private subtractInterval(intervals: TimeInterval[], busy: TimeInterval): TimeInterval[] {
    const result: TimeInterval[] = [];

    for (const interval of intervals) {
      if (busy.end <= interval.start || busy.start >= interval.end) {
        result.push(interval);
        continue;
      }

      if (busy.start > interval.start) {
        result.push({
          start: new Date(interval.start),
          end: new Date(Math.min(busy.start.getTime(), interval.end.getTime())),
        });
      }

      if (busy.end < interval.end) {
        result.push({
          start: new Date(Math.max(busy.end.getTime(), interval.start.getTime())),
          end: new Date(interval.end),
        });
      }
    }

    return result;
  }

  private splitIntoSlots(intervals: TimeInterval[], durationMinutes: number): TimeInterval[] {
    if (durationMinutes <= 0) {
      return [];
    }

    const slots: TimeInterval[] = [];
    const durationMs = durationMinutes * 60 * 1000;

    for (const interval of intervals) {
      let cursor = new Date(interval.start);

      while (cursor.getTime() + durationMs <= interval.end.getTime()) {
        const slotEnd = new Date(cursor.getTime() + durationMs);

        if (slotEnd > interval.end) {
          break;
        }

        slots.push({ start: new Date(cursor), end: slotEnd });
        cursor = slotEnd;
      }
    }

    return slots;
  }

  private filterPastSlots(slots: TimeInterval[], dayStart: Date): TimeInterval[] {
    const now = new Date();

    if (dayStart.toDateString() !== now.toDateString()) {
      return slots;
    }

    return slots.filter((slot) => slot.end > now);
  }

  private clampInterval(interval: TimeInterval, dayStart: Date, dayEnd: Date): TimeInterval | null {
    const start = new Date(Math.max(interval.start.getTime(), dayStart.getTime()));
    const end = new Date(Math.min(interval.end.getTime(), dayEnd.getTime()));

    if (end <= start) {
      return null;
    }

    return { start, end };
  }

  private combineDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours ?? 0, minutes ?? 0, 0, 0);
    return result;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatTime(date: Date): string {
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
