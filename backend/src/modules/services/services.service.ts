import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from '../../database/entities/service.entity';
import {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceResponseDto,
} from '../../common/dtos/service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly serviceRepository: Repository<ServiceEntity>,
  ) {}

  async findAll({
    businessId,
    businessPhone,
  }: {
    businessId?: number;
    businessPhone?: string;
  }): Promise<ServiceEntity[]> {
    if (businessId) {
      return this.serviceRepository.find({
        where: { businessId },
        order: { name: 'ASC' },
      });
    } else if (businessPhone) {
      return this.serviceRepository.find({
        where: { business: { phone: businessPhone } },
        order: { name: 'ASC' },
        relations: ['business'],
      });
    }

    return this.serviceRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: number): Promise<ServiceEntity> {
    const service = await this.serviceRepository.findOne({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async findByBusinessId(businessId: number): Promise<ServiceEntity[]> {
    return this.serviceRepository.find({
      where: { businessId },
      order: { name: 'ASC' },
    });
  }

  async create(createServiceDto: CreateServiceDto): Promise<ServiceEntity> {
    if (!createServiceDto.businessId) {
      throw new BadRequestException('businessId is required');
    }

    const service = this.serviceRepository.create({
      businessId: createServiceDto.businessId,
      name: createServiceDto.name,
      description: createServiceDto.description,
      duration: createServiceDto.duration,
      price: createServiceDto.price,
      active: createServiceDto.active !== undefined ? createServiceDto.active : true,
    });

    return this.serviceRepository.save(service);
  }

  async update(id: number, updateServiceDto: UpdateServiceDto): Promise<ServiceEntity> {
    const service = await this.findById(id);

    const updateData: any = {};
    if (updateServiceDto.name) updateData.name = updateServiceDto.name;
    if (updateServiceDto.description) updateData.description = updateServiceDto.description;
    if (updateServiceDto.duration) updateData.duration = updateServiceDto.duration;
    if (updateServiceDto.price) updateData.price = updateServiceDto.price;
    if (updateServiceDto.active !== undefined) updateData.active = updateServiceDto.active;

    await this.serviceRepository.update(id, updateData);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    const service = await this.findById(id);
    await this.serviceRepository.delete(id);
  }
}
