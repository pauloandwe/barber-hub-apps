import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfessionalEntity } from '../../database/entities/professional.entity';
import { CreateProfessionalDto, UpdateProfessionalDto, ProfessionalResponseDto } from '../../common/dtos/professional.dto';

@Injectable()
export class ProfessionalsService {
  constructor(
    @InjectRepository(ProfessionalEntity)
    private readonly professionalRepository: Repository<ProfessionalEntity>,
  ) {}

  async findAll({
    businessId,
    businessPhone,
  }: {
    businessId?: number;
    businessPhone?: string;
  }): Promise<ProfessionalEntity[]> {
    if (businessId) {
      return this.professionalRepository.find({
        where: { businessId },
        order: { name: 'ASC' },
      });
    } else if (businessPhone) {
      return this.professionalRepository.find({
        where: { business: { phone: businessPhone } },
        order: { name: 'ASC' },
        relations: ['business'],
      });
    }
    return this.professionalRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: number): Promise<ProfessionalEntity> {
    const professional = await this.professionalRepository.findOne({
      where: { id },
    });

    if (!professional) {
      throw new NotFoundException(`Professional with ID ${id} not found`);
    }

    return professional;
  }

  async findByBusinessId(businessId: number): Promise<ProfessionalEntity[]> {
    return this.professionalRepository.find({
      where: { businessId },
      order: { name: 'ASC' },
    });
  }

  async create(createBarberDto: CreateProfessionalDto): Promise<ProfessionalEntity> {
    if (!createBarberDto.businessId) {
      throw new BadRequestException('businessId is required');
    }

    const professional = this.professionalRepository.create({
      businessId: createBarberDto.businessId,
      name: createBarberDto.name,
      specialties: createBarberDto.specialties,
      active: createBarberDto.active !== undefined ? createBarberDto.active : true,
    });

    return this.professionalRepository.save(professional);
  }

  async update(id: number, updateBarberDto: UpdateProfessionalDto): Promise<ProfessionalEntity> {
    const professional = await this.findById(id);

    const updateData: any = {};
    if (updateBarberDto.name) updateData.name = updateBarberDto.name;
    if (updateBarberDto.phone) updateData.phone = updateBarberDto.phone;
    if (updateBarberDto.specialties) updateData.specialties = updateBarberDto.specialties;
    if (updateBarberDto.active !== undefined) updateData.active = updateBarberDto.active;

    await this.professionalRepository.update(id, updateData);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    const professional = await this.findById(id);
    await this.professionalRepository.delete(id);
  }
}
