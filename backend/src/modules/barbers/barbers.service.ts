import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BarberEntity } from '../../database/entities/barber.entity';
import { CreateBarberDto, UpdateBarberDto, BarberResponseDto } from '../../common/dtos/barber.dto';

@Injectable()
export class BarbersService {
  constructor(
    @InjectRepository(BarberEntity)
    private readonly barberRepository: Repository<BarberEntity>,
  ) {}

  async findAll(businessId?: number): Promise<BarberEntity[]> {
    if (businessId) {
      return this.barberRepository.find({
        where: { businessId },
        order: { name: 'ASC' },
      });
    }
    return this.barberRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: number): Promise<BarberEntity> {
    const barber = await this.barberRepository.findOne({
      where: { id },
    });

    if (!barber) {
      throw new NotFoundException(`Barber with ID ${id} not found`);
    }

    return barber;
  }

  async findByBusinessId(businessId: number): Promise<BarberEntity[]> {
    return this.barberRepository.find({
      where: { businessId },
      order: { name: 'ASC' },
    });
  }

  async create(createBarberDto: CreateBarberDto): Promise<BarberEntity> {
    if (!createBarberDto.businessId) {
      throw new BadRequestException('businessId is required');
    }

    const barber = this.barberRepository.create({
      businessId: createBarberDto.businessId,
      name: createBarberDto.name,
      specialties: createBarberDto.specialties,
      active: createBarberDto.active !== undefined ? createBarberDto.active : true,
    });

    return this.barberRepository.save(barber);
  }

  async update(id: number, updateBarberDto: UpdateBarberDto): Promise<BarberEntity> {
    const barber = await this.findById(id);

    const updateData: any = {};
    if (updateBarberDto.name) updateData.name = updateBarberDto.name;
    if (updateBarberDto.phone) updateData.phone = updateBarberDto.phone;
    if (updateBarberDto.specialties) updateData.specialties = updateBarberDto.specialties;
    if (updateBarberDto.active !== undefined) updateData.active = updateBarberDto.active;

    await this.barberRepository.update(id, updateData);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    const barber = await this.findById(id);
    await this.barberRepository.delete(id);
  }
}
