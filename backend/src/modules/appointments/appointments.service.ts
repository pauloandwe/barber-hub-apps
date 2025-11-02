import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository, In, Not } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AppointmentEntity,
  AppointmentStatus,
  BusinessEntity,
  ServiceEntity,
  BarberEntity,
  ProfileEntity,
  ClientContactEntity,
  BarberWorkingHoursEntity,
} from 'src/database/entities';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  SuggestAppointmentDto,
  AppointmentResponseDto,
  AppointmentSuggestionsDto,
} from 'src/common/dtos/appointment.dto';
import {
  AppointmentTimelineResponseDto,
  BarberTimelineDto,
  AppointmentTimelineCardDto,
  BarberWorkingHourDto,
} from 'src/common/dtos/appointment-timeline.dto';
import { RemindersService } from '../reminders/reminders.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(AppointmentEntity)
    private appointmentRepository: Repository<AppointmentEntity>,
    @InjectRepository(BusinessEntity)
    private businessRepository: Repository<BusinessEntity>,
    @InjectRepository(ServiceEntity)
    private serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(BarberEntity)
    private barberRepository: Repository<BarberEntity>,
    @InjectRepository(ProfileEntity)
    private profileRepository: Repository<ProfileEntity>,
    @InjectRepository(ClientContactEntity)
    private clientContactRepository: Repository<ClientContactEntity>,
    @InjectRepository(BarberWorkingHoursEntity)
    private barberWorkingHoursRepository: Repository<BarberWorkingHoursEntity>,
    private remindersService: RemindersService,
  ) {}

  async findByBusinessId(businessId: number): Promise<AppointmentResponseDto[]> {
    const appointments = await this.appointmentRepository.find({
      where: { businessId },
      relations: ['barber', 'client', 'service', 'clientContact'],
      order: { startDate: 'DESC' },
    });

    return appointments.map((appointment) => this.formatAppointmentResponse(appointment));
  }

  async findByPhoneNumber(
    phoneNumber: string,
    businessId?: number,
    statuses?: AppointmentStatus[],
  ): Promise<AppointmentResponseDto[]> {
    const normalizedPhone = this.normalizePhone(phoneNumber);

    if (!normalizedPhone) {
      throw new BadRequestException('Invalid phone number format');
    }

    const clientContact = await this.clientContactRepository.findOne({
      where: businessId
        ? {
            phone: normalizedPhone,
            businessId,
          }
        : {
            phone: normalizedPhone,
          },
    });

    if (!clientContact) {
      return [];
    }

    const uniqueStatuses =
      statuses && statuses.length > 0 ? Array.from(new Set(statuses)) : undefined;

    const baseWhere = businessId
      ? {
          clientContactId: clientContact.id,
          businessId,
        }
      : {
          clientContactId: clientContact.id,
        };

    const where = { ...baseWhere } as {
      clientContactId: number;
      businessId?: number;
      status?: AppointmentStatus | ReturnType<typeof In>;
    };

    if (uniqueStatuses && uniqueStatuses.length === 1) {
      where.status = uniqueStatuses[0];
    } else if (uniqueStatuses && uniqueStatuses.length > 1) {
      where.status = In(uniqueStatuses);
    }

    const appointments = await this.appointmentRepository.find({
      where,
      relations: ['barber', 'client', 'service', 'clientContact'],
      order: { startDate: 'DESC' },
    });

    return appointments.map((appointment) => this.formatAppointmentResponse(appointment));
  }

  async findById(appointmentId: number, businessId: number): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepository.findOne({
      where: {
        id: appointmentId,
        businessId,
      },
      relations: ['barber', 'client', 'service', 'clientContact'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return this.formatAppointmentResponse(appointment);
  }

  async getTimelineByDate(
    businessId: number,
    date: string,
    barberIds?: number[],
    status?: 'pending' | 'confirmed' | 'canceled',
    serviceId?: number,
  ): Promise<AppointmentTimelineResponseDto> {
    const [year, month, day] = date.split('-').map(Number);

    if (!year || !month || !day) {
      throw new BadRequestException('Invalid date format. Expected yyyy-MM-dd.');
    }

    const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    let barbers = await this.barberRepository.find({
      where: {
        businessId,
        active: true,
      },
    });

    if (barberIds && barberIds.length > 0) {
      barbers = barbers.filter((b) => barberIds.includes(b.id));
    }

    const appointmentQuery = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.businessId = :businessId', { businessId })
      .andWhere('appointment.startDate >= :startDate', { startDate })
      .andWhere('appointment.startDate < :endDate', { endDate })
      .leftJoinAndSelect('appointment.barber', 'barber')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('appointment.clientContact', 'clientContact');

    if (status) {
      appointmentQuery.andWhere('appointment.status = :status', { status });
    }

    if (serviceId) {
      appointmentQuery.andWhere('appointment.serviceId = :serviceId', { serviceId });
    }

    const appointments = await appointmentQuery.getMany();

    let workingHours = [];
    if (barbers.length > 0) {
      const barberIds = barbers.map((b) => b.id);
      workingHours = await this.barberWorkingHoursRepository.find({
        where: {
          barberId: In(barberIds),
        },
      });
    }

    const dayOfWeek = new Date(year, month - 1, day).getDay();

    const barberTimelines: BarberTimelineDto[] = barbers.map((barber) => {
      const barberAppointments = appointments.filter((a) => a.barberId === barber.id);
      const barberWorkingHour = workingHours.find(
        (wh) => wh.barberId === barber.id && wh.dayOfWeek === dayOfWeek,
      );

      return {
        id: barber.id,
        name: barber.name,
        specialties: barber.specialties || [],
        appointments: barberAppointments.map((apt) => this.formatAppointmentTimelineCard(apt)),
        workingHours: barberWorkingHour
          ? this.formatWorkingHourDto(barberWorkingHour)
          : this.getDefaultClosedHours(),
      };
    });

    return {
      date,
      barbers: barberTimelines,
      slotDurationMinutes: 30,
    };
  }

  private formatAppointmentTimelineCard(
    appointment: AppointmentEntity,
  ): AppointmentTimelineCardDto {
    return {
      id: appointment.id,
      barberId: appointment.barberId,
      startDate: appointment.startDate.toISOString(),
      endDate: appointment.endDate.toISOString(),
      status: appointment.status,
      notes: appointment.notes,
      source: appointment.source,
      clientContact: appointment.clientContact
        ? {
            name: appointment.clientContact.name,
            phone: appointment.clientContact.phone,
          }
        : {
            name: null,
            phone: '',
          },
      service: appointment.service
        ? {
            name: appointment.service.name,
            duration: appointment.service.duration,
            price: appointment.service.price,
          }
        : {
            name: '',
            duration: 0,
            price: 0,
          },
    };
  }

  private formatWorkingHourDto(workingHour: BarberWorkingHoursEntity): BarberWorkingHourDto {
    return {
      dayOfWeek: workingHour.dayOfWeek,
      openTime: workingHour.openTime,
      closeTime: workingHour.closeTime,
      breakStart: workingHour.breakStart,
      breakEnd: workingHour.breakEnd,
      closed: workingHour.closed,
    };
  }

  private getDefaultClosedHours(): BarberWorkingHourDto {
    return {
      dayOfWeek: 0,
      openTime: null,
      closeTime: null,
      breakStart: null,
      breakEnd: null,
      closed: true,
    };
  }

  async create(createAppointmentDto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
    this.validateDateStringWithTimezone(createAppointmentDto.startDate);
    this.validateDateStringWithTimezone(createAppointmentDto.endDate);

    const business = await this.businessRepository.findOne({
      where: { id: createAppointmentDto.businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const service = await this.serviceRepository.findOne({
      where: {
        id: createAppointmentDto.serviceId,
        businessId: createAppointmentDto.businessId,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const barber = await this.barberRepository.findOne({
      where: {
        id: createAppointmentDto.barberId,
        businessId: createAppointmentDto.businessId,
      },
    });

    if (!barber) {
      throw new NotFoundException('Barber not found');
    }

    const startDate = new Date(createAppointmentDto.startDate);
    const endDate = new Date(createAppointmentDto.endDate);

    const existingAppointment = await this.appointmentRepository.findOne({
      where: {
        barberId: createAppointmentDto.barberId,
        startDate: startDate,
      },
    });

    if (existingAppointment) {
      throw new BadRequestException('Time slot already booked');
    }

    const { clientId, clientContact } = await this.resolveClientDetails(
      createAppointmentDto.businessId,
      {
        clientId: createAppointmentDto.clientId,
        clientPhone: createAppointmentDto.clientPhone,
        clientName: createAppointmentDto.clientName,
      },
    );

    const appointment = this.appointmentRepository.create({
      businessId: createAppointmentDto.businessId,
      serviceId: createAppointmentDto.serviceId,
      barberId: createAppointmentDto.barberId,
      clientId: clientId ?? null,
      clientContactId: clientContact?.id ?? null,
      startDate: startDate,
      endDate: endDate,
      notes: createAppointmentDto.notes,
      source: createAppointmentDto.source,
    });

    const savedAppointment = await this.appointmentRepository.save(appointment);

    // Schedule reminders asynchronously
    try {
      await this.remindersService.scheduleConfirmationReminder(savedAppointment.id);
      await this.remindersService.schedulePreAppointmentReminders(savedAppointment.id);
    } catch (error) {
      console.error('Failed to schedule reminders for appointment:', error);
      // Don't fail the appointment creation if reminder scheduling fails
    }

    return this.formatAppointmentResponse(savedAppointment);
  }

  async update(
    appointmentId: number,
    businessId: number,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepository.findOne({
      where: {
        id: appointmentId,
        businessId,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    this.validateDateStringWithTimezone(updateAppointmentDto.startDate);
    this.validateDateStringWithTimezone(updateAppointmentDto.endDate);

    // Track original values for reminder scheduling
    const originalStartDate = appointment.startDate;

    const shouldCheckConflicts =
      updateAppointmentDto.startDate !== undefined ||
      updateAppointmentDto.endDate !== undefined ||
      updateAppointmentDto.barberId !== undefined;

    if (shouldCheckConflicts) {
      const newStartTime = updateAppointmentDto.startDate
        ? new Date(updateAppointmentDto.startDate)
        : appointment.startDate;
      const barberId = updateAppointmentDto.barberId ?? appointment.barberId;

      const conflict = await this.appointmentRepository.findOne({
        where: {
          barberId,
          businessId,
          startDate: newStartTime,
          id: Not(appointmentId),
        },
      });

      if (conflict) {
        throw new BadRequestException('Time slot already booked');
      }
    }

    if (
      updateAppointmentDto.clientId !== undefined ||
      updateAppointmentDto.clientPhone ||
      updateAppointmentDto.clientName
    ) {
      const { clientId, clientContact } = await this.resolveClientDetails(
        businessId,
        {
          clientId:
            updateAppointmentDto.clientId !== undefined
              ? updateAppointmentDto.clientId
              : (appointment.clientId ?? undefined),
          clientPhone: updateAppointmentDto.clientPhone,
          clientName: updateAppointmentDto.clientName,
        },
        appointment.clientContactId,
      );

      appointment.clientId = clientId;
      appointment.clientContactId = clientContact?.id ?? appointment.clientContactId ?? null;
    }

    if (updateAppointmentDto.serviceId !== undefined) {
      appointment.serviceId = updateAppointmentDto.serviceId;
    }

    if (updateAppointmentDto.barberId !== undefined) {
      appointment.barberId = updateAppointmentDto.barberId;
    }

    if (updateAppointmentDto.startDate) {
      appointment.startDate = new Date(updateAppointmentDto.startDate);
    }

    if (updateAppointmentDto.endDate) {
      appointment.endDate = new Date(updateAppointmentDto.endDate);
    }

    if (updateAppointmentDto.notes !== undefined) {
      appointment.notes = updateAppointmentDto.notes;
    }

    if (updateAppointmentDto.source !== undefined) {
      appointment.source = updateAppointmentDto.source;
    }

    // Handle reschedule (date/time change) - reschedule pre-appointment reminders
    const dateChanged = updateAppointmentDto.startDate &&
      originalStartDate.getTime() !== appointment.startDate.getTime();

    if (dateChanged && appointment.status !== AppointmentStatus.CANCELED) {
      try {
        await this.remindersService.schedulePreAppointmentReminders(appointmentId);
      } catch (error) {
        console.error('Failed to reschedule pre-appointment reminders:', error);
      }
    }

    const updatedAppointment = await this.appointmentRepository.save(appointment);

    return this.formatAppointmentResponse(updatedAppointment);
  }

  async partialUpdate(
    appointmentId: number,
    businessId: number,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return this.update(appointmentId, businessId, updateAppointmentDto);
  }

  async delete(appointmentId: number, businessId: number): Promise<void> {
    const appointment = await this.appointmentRepository.findOne({
      where: {
        id: appointmentId,
        businessId,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Schedule rescheduling reminder before deleting
    try {
      if (appointment.status !== AppointmentStatus.CANCELED) {
        await this.remindersService.scheduleRescheduleReminder(appointmentId, 3);
      }
    } catch (error) {
      console.error('Failed to schedule reschedule reminder on delete:', error);
    }

    await this.appointmentRepository.remove(appointment);
  }

  async suggestAppointments(
    suggestAppointmentDto: SuggestAppointmentDto,
  ): Promise<AppointmentSuggestionsDto> {
    const { businessId, serviceId, startDate } = suggestAppointmentDto;

    const suggestions: AppointmentSuggestionsDto = {};

    if (businessId && !startDate) {
      const business = await this.businessRepository.findOne({
        where: { id: businessId },
        relations: ['workingHours'],
      });

      if (business) {
        suggestions.availableDates = this.getAvailableDates(business.workingHours);
      }
    }

    if (businessId && serviceId) {
      const service = await this.serviceRepository.findOne({
        where: { id: serviceId },
      });

      if (service) {
        suggestions.serviceDuration = service.duration;
      }
    }

    return suggestions;
  }

  private normalizePhone(phone?: string): string | null {
    if (!phone) {
      return null;
    }

    const digits = phone.replace(/\D/g, '');
    return digits.length ? digits : null;
  }

  /**
   * Valida se a data é uma string ISO válida com timezone explícito.
   * Aceita formatos como: "2025-03-20T14:30:00Z" ou "2025-03-20T14:30:00+00:00"
   * Rejeita formatos sem timezone como: "2025-03-20T14:30:00"
   */
  private validateDateStringWithTimezone(dateString?: string): void {
    if (!dateString) {
      return;
    }

    // Verifica se é uma string ISO válida
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    if (!isoRegex.test(dateString)) {
      throw new BadRequestException(
        `Data em formato inválido. Deve ser ISO 8601 com timezone. Recebido: "${dateString}". Esperado: "2025-03-20T14:30:00Z" ou "2025-03-20T14:30:00+00:00"`,
      );
    }

    // Tenta fazer parse da data para garantir que é válida
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`Data inválida. Não consegui fazer parse: "${dateString}"`);
    }
  }

  private async resolveClientDetails(
    businessId: number,
    payload: { clientId?: number; clientPhone?: string; clientName?: string },
    currentContactId?: number | null,
  ): Promise<{ clientId: number | null; clientContact: ClientContactEntity | null }> {
    let resolvedClientId = payload.clientId ?? null;
    const normalizedPhone = this.normalizePhone(payload.clientPhone);
    let clientContact: ClientContactEntity | null = null;

    if (payload.clientPhone && !normalizedPhone) {
      throw new BadRequestException('Client phone is invalid');
    }

    if (normalizedPhone) {
      clientContact = await this.clientContactRepository.findOne({
        where: {
          businessId,
          phone: normalizedPhone,
        },
      });

      if (!clientContact) {
        clientContact = this.clientContactRepository.create({
          businessId,
          phone: normalizedPhone,
          name: payload.clientName?.trim() || null,
        });
        clientContact = await this.clientContactRepository.save(clientContact);
      } else {
        const incomingName = payload.clientName?.trim();
        if (incomingName && incomingName !== clientContact.name) {
          clientContact.name = incomingName;
          clientContact = await this.clientContactRepository.save(clientContact);
        }
      }

      if (!resolvedClientId) {
        const existingProfile = await this.profileRepository.findOne({
          where: { phone: normalizedPhone },
        });
        if (existingProfile) {
          resolvedClientId = existingProfile.id;
        }
      }
    } else if (currentContactId) {
      clientContact = await this.clientContactRepository.findOne({
        where: { id: currentContactId },
      });

      const incomingName = payload.clientName?.trim();
      if (clientContact && incomingName && incomingName !== clientContact.name) {
        clientContact.name = incomingName;
        clientContact = await this.clientContactRepository.save(clientContact);
      }
    }

    if (!resolvedClientId && !normalizedPhone && !currentContactId) {
      throw new BadRequestException('clientId or clientPhone must be provided');
    }

    return { clientId: resolvedClientId, clientContact };
  }

  private getAvailableDates(workingHours: any[]): string[] {
    const dates: string[] = [];
    const today = new Date();

    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      const dayOfWeek = date.getDay();
      const workingDay = workingHours.find((wh) => wh.dayOfWeek === dayOfWeek);

      if (workingDay && !workingDay.closed) {
        const dateStr = date.toISOString().split('T')[0];
        dates.push(dateStr);
      }
    }

    return dates;
  }

  private formatAppointmentResponse(appointment: AppointmentEntity): AppointmentResponseDto {
    return {
      id: appointment.id,
      businessId: appointment.businessId,
      serviceId: appointment.serviceId,
      barberId: appointment.barberId,
      clientId: appointment.clientId ?? null,
      clientContactId: appointment.clientContactId ?? null,
      startDate: appointment.startDate,
      endDate: appointment.endDate,
      notes: appointment.notes,
      source: appointment.source,
      status: appointment.status,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      barber: appointment.barber
        ? { id: appointment.barber.id, name: appointment.barber.name }
        : undefined,
      client: appointment.client
        ? { id: appointment.client.id, name: appointment.client.name }
        : undefined,
      clientContact: appointment.clientContact
        ? {
            id: appointment.clientContact.id,
            name: appointment.clientContact.name,
            phone: appointment.clientContact.phone,
          }
        : undefined,
      service: appointment.service
        ? {
            id: appointment.service.id,
            name: appointment.service.name,
            duration: appointment.service.duration,
          }
        : undefined,
    };
  }
}
