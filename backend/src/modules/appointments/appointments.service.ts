import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AppointmentEntity,
  BusinessEntity,
  ServiceEntity,
  BarberEntity,
  ProfileEntity,
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
  ) {}

  async findByBusinessId(businessId: number): Promise<AppointmentResponseDto[]> {
    const appointments = await this.appointmentRepository.find({
      where: { businessId },
      relations: ['barber', 'client', 'service'],
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
      relations: ['barber', 'client', 'service'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return this.formatAppointmentResponse(appointment);
  }

  async create(createAppointmentDto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
    // Validate business exists
    const business = await this.businessRepository.findOne({
      where: { id: createAppointmentDto.businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Validate service exists
    const service = await this.serviceRepository.findOne({
      where: {
        id: createAppointmentDto.serviceId,
        businessId: createAppointmentDto.businessId,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Validate barber exists
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

    const appointment = this.appointmentRepository.create({
      businessId: createAppointmentDto.businessId,
      serviceId: createAppointmentDto.serviceId,
      barberId: createAppointmentDto.barberId,
      clientId: createAppointmentDto.clientId,
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

    const updateData = { ...updateAppointmentDto };
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate) as any;
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate) as any;
    }

    Object.assign(appointment, updateData);
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
      // Suggest service duration
      const service = await this.serviceRepository.findOne({
        where: { id: serviceId },
      });

      if (service) {
        suggestions.serviceDuration = service.duration;
      }
    }

    return { data: suggestions };
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
      clientId: appointment.clientId,
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
      service: appointment.service
        ? {
            id: appointment.service.id,
            name: appointment.service.name,
            duration: appointment.service.duration,
          }
        : undefined,
      data_inicio: appointment.startDate,
      data_fim: appointment.endDate,
      observacoes: appointment.notes,
      origem: appointment.source,
      barbers: appointment.barber ? { nome: appointment.barber.name } : undefined,
      profiles: appointment.client ? { nome: appointment.client.name } : undefined,
      servicos: appointment.service
        ? { nome: appointment.service.name, duracao_min: appointment.service.duration }
        : undefined,
    };
  }
}
