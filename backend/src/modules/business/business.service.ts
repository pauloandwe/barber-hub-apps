import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessEntity } from '../../database/entities/business.entity';
import { CreateBusinessDto } from '../../common/dtos/create-business.dto';
import { UpdateBusinessDto } from '../../common/dtos/update-business.dto';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(BusinessEntity)
    private readonly businessRepository: Repository<BusinessEntity>,
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

  async create(createBusinessDto: CreateBusinessDto): Promise<BusinessEntity> {
    const business = this.businessRepository.create(createBusinessDto);
    return this.businessRepository.save(business);
  }

  async update(
    id: number,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<BusinessEntity> {
    await this.businessRepository.update(id, updateBusinessDto);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.businessRepository.delete(id);
  }
}
