import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BloqueioEntity, BarberEntity } from 'src/database/entities';

export class CreateBloqueioDto {
  barbeiro_id: number;
  data_inicio: string;
  data_fim: string;
  motivo?: string;
}

export class BloqueioResponseDto {
  id: number;
  barbeiro_id: number;
  data_inicio: Date;
  data_fim: Date;
  motivo: string;
  created_at: Date;
}

@Injectable()
export class BloqueiosService {
  constructor(
    @InjectRepository(BloqueioEntity)
    private bloqueioRepository: Repository<BloqueioEntity>,
    @InjectRepository(BarberEntity)
    private barberRepository: Repository<BarberEntity>,
  ) {}

  async create(createBloqueioDto: CreateBloqueioDto): Promise<BloqueioResponseDto> {
    // Validate barber exists
    const barber = await this.barberRepository.findOne({
      where: { id: createBloqueioDto.barbeiro_id },
    });

    if (!barber) {
      throw new NotFoundException('Barber not found');
    }

    // Validate dates
    const dataInicio = new Date(createBloqueioDto.data_inicio);
    const dataFim = new Date(createBloqueioDto.data_fim);

    if (dataInicio >= dataFim) {
      throw new BadRequestException('Start date must be before end date');
    }

    const bloqueio = this.bloqueioRepository.create({
      barbeiro_id: createBloqueioDto.barbeiro_id,
      data_inicio: dataInicio,
      data_fim: dataFim,
      motivo: createBloqueioDto.motivo,
    });

    const savedBloqueio = await this.bloqueioRepository.save(bloqueio);
    return this.formatBloqueioResponse(savedBloqueio);
  }

  async findByBarbeiro(barbeiro_id: number): Promise<BloqueioResponseDto[]> {
    const bloqueios = await this.bloqueioRepository.find({
      where: { barbeiro_id },
      order: { data_inicio: 'DESC' },
    });

    return bloqueios.map((b) => this.formatBloqueioResponse(b));
  }

  async findById(id: number): Promise<BloqueioResponseDto> {
    const bloqueio = await this.bloqueioRepository.findOne({
      where: { id },
    });

    if (!bloqueio) {
      throw new NotFoundException('Bloqueio not found');
    }

    return this.formatBloqueioResponse(bloqueio);
  }

  async delete(id: number): Promise<void> {
    const bloqueio = await this.bloqueioRepository.findOne({
      where: { id },
    });

    if (!bloqueio) {
      throw new NotFoundException('Bloqueio not found');
    }

    await this.bloqueioRepository.remove(bloqueio);
  }

  private formatBloqueioResponse(bloqueio: BloqueioEntity): BloqueioResponseDto {
    return {
      id: bloqueio.id,
      barbeiro_id: bloqueio.barbeiro_id,
      data_inicio: bloqueio.data_inicio,
      data_fim: bloqueio.data_fim,
      motivo: bloqueio.motivo,
      created_at: bloqueio.created_at,
    };
  }
}
