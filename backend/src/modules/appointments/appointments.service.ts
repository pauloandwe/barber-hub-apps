import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AppointmentEntity,
  BusinessEntity,
  ServiceEntity,
  BarberEntity,
  ProfileEntity,
  ClientContactEntity,
} from 'src/database/entities';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  SuggestAppointmentDto,
  AppointmentResponseDto,
} from 'src/common/dtos/appointment.dto';

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
  ) {}

  async findByBusinessId(businessId: number): Promise<AppointmentResponseDto[]> {
    const appointments = await this.appointmentRepository.find({
      where: { businessId },
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

  async create(createAppointmentDto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
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

    if (updateAppointmentDto.startDate || updateAppointmentDto.endDate) {
      const newStartTime = updateAppointmentDto.startDate
        ? new Date(updateAppointmentDto.startDate)
        : appointment.startDate;
      const barberId = updateAppointmentDto.barberId || appointment.barberId;

      const conflict = await this.appointmentRepository.findOne({
        where: {
          barberId,
          startDate: newStartTime,
          id: appointmentId !== appointmentId ? appointmentId : undefined,
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
              : appointment.clientId ?? undefined,
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

    await this.appointmentRepository.remove(appointment);
  }

  async suggestAppointments(suggestAppointmentDto: SuggestAppointmentDto): Promise<{ data: any }> {
    const { businessId, serviceId, barberId, startDate } = suggestAppointmentDto;

    const suggestions: any = {};

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

    return { data: suggestions };
  }

  private normalizePhone(phone?: string): string | null {
    if (!phone) {
      return null;
    }

    const digits = phone.replace(/\D/g, '');
    return digits.length ? digits : null;
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
