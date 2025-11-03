import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UnavailabilityEntity, ProfessionalEntity } from 'src/database/entities';

export class CreateUnavailabilityDto {
  professional_id: number;
  data_inicio: string;
  data_fim: string;
  motivo?: string;
}

export class UnavailabilityResponseDto {
  id: number;
  professional_id: number;
  data_inicio: Date;
  data_fim: Date;
  motivo: string;
  created_at: Date;
}

@Injectable()
export class UnavailabilityService {
  constructor(
    @InjectRepository(UnavailabilityEntity)
    private unavailabilityRepository: Repository<UnavailabilityEntity>,
    @InjectRepository(ProfessionalEntity)
    private professionalRepository: Repository<ProfessionalEntity>,
  ) {}

  async create(createUnavailabilityDto: CreateUnavailabilityDto): Promise<UnavailabilityResponseDto> {
    const professional = await this.professionalRepository.findOne({
      where: { id: createUnavailabilityDto.professional_id },
    });

    if (!professional) {
      throw new NotFoundException('Professional not found');
    }

    const dataInicio = new Date(createUnavailabilityDto.data_inicio);
    const dataFim = new Date(createUnavailabilityDto.data_fim);

    if (dataInicio >= dataFim) {
      throw new BadRequestException('Start date must be before end date');
    }

    const unavailability = this.unavailabilityRepository.create({
      professional_id: createUnavailabilityDto.professional_id,
      data_inicio: dataInicio,
      data_fim: dataFim,
      motivo: createUnavailabilityDto.motivo,
    });

    const savedUnavailability = await this.unavailabilityRepository.save(unavailability);
    return this.formatUnavailabilityResponse(savedUnavailability);
  }

  async findByProfessional(professional_id: number): Promise<UnavailabilityResponseDto[]> {
    const unavailability = await this.unavailabilityRepository.find({
      where: { professional_id },
      order: { data_inicio: 'DESC' },
    });

    return unavailability.map((b) => this.formatUnavailabilityResponse(b));
  }

  async findById(id: number): Promise<UnavailabilityResponseDto> {
    const unavailability = await this.unavailabilityRepository.findOne({
      where: { id },
    });

    if (!unavailability) {
      throw new NotFoundException('Unavailability not found');
    }

    return this.formatUnavailabilityResponse(unavailability);
  }

  async delete(id: number): Promise<void> {
    const unavailability = await this.unavailabilityRepository.findOne({
      where: { id },
    });

    if (!unavailability) {
      throw new NotFoundException('Unavailability not found');
    }

    await this.unavailabilityRepository.remove(unavailability);
  }

  private formatUnavailabilityResponse(unavailability: UnavailabilityEntity): UnavailabilityResponseDto {
    return {
      id: unavailability.id,
      professional_id: unavailability.professional_id,
      data_inicio: unavailability.data_inicio,
      data_fim: unavailability.data_fim,
      motivo: unavailability.motivo,
      created_at: unavailability.created_at,
    };
  }
}
