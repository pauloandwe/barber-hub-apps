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

    // Check for conflicts based on time range
    // data_inicio and data_fim should be full timestamps
    const dataInicio = new Date(createAppointmentDto.data_inicio);
    const dataFim = new Date(createAppointmentDto.data_fim);

    const existingAppointment = await this.appointmentRepository.findOne({
      where: {
        barberId: createAppointmentDto.barberId,
        data_inicio: dataInicio,
      },
    });

    if (existingAppointment) {
      throw new BadRequestException('Time slot already booked');
    }

    const appointment = this.appointmentRepository.create({
      businessId: createAppointmentDto.businessId,
      serviceId: createAppointmentDto.serviceId,
      barberId: createAppointmentDto.barberId,
      clienteId: createAppointmentDto.clienteId,
      data_inicio: dataInicio,
      data_fim: dataFim,
      observacoes: createAppointmentDto.observacoes,
      origem: createAppointmentDto.origem,
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

    // Validate time slot if date changed
    if (updateAppointmentDto.data_inicio || updateAppointmentDto.data_fim) {
      const newStartTime = updateAppointmentDto.data_inicio
        ? new Date(updateAppointmentDto.data_inicio)
        : appointment.data_inicio;
      const barberId = updateAppointmentDto.barberId || appointment.barberId;

      const conflict = await this.appointmentRepository.findOne({
        where: {
          barberId,
          data_inicio: newStartTime,
          id: appointmentId !== appointmentId ? appointmentId : undefined,
        },
      });

      if (conflict) {
        throw new BadRequestException('Time slot already booked');
      }
    }

    // Convert date strings to Date objects if present
    const updateData = { ...updateAppointmentDto };
    if (updateData.data_inicio) {
      updateData.data_inicio = new Date(updateData.data_inicio) as any;
    }
    if (updateData.data_fim) {
      updateData.data_fim = new Date(updateData.data_fim) as any;
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

  async suggestAppointments(
    suggestAppointmentDto: SuggestAppointmentDto,
  ): Promise<{ data: any }> {
    // This endpoint returns suggestions for completing the appointment draft
    const { businessId, serviceId, barberId, data_inicio } = suggestAppointmentDto;

    const suggestions: any = {};

    if (businessId && !data_inicio) {
      // Suggest available dates
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

    // Generate available dates for the next 30 days
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
      clienteId: appointment.clienteId,
      data_inicio: appointment.data_inicio,
      data_fim: appointment.data_fim,
      observacoes: appointment.observacoes,
      origem: appointment.origem,
      status: appointment.status,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }
}
