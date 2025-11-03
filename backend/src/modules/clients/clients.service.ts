import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientContactEntity } from 'src/database/entities/client-contact.entity';

export class ClientContactResponseDto {
  id: number;
  businessId: number;
  phone: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(ClientContactEntity)
    private clientContactRepository: Repository<ClientContactEntity>,
  ) {}

  async getClientByPhone(
    businessId: number,
    phone: string,
  ): Promise<ClientContactResponseDto | null> {
    const client = await this.clientContactRepository.findOne({
      where: { businessId, phone },
    });

    if (!client) {
      return null;
    }

    return this.formatClientResponse(client);
  }

  async createOrUpdateClientName(
    businessId: number,
    phone: string,
    name: string,
  ): Promise<ClientContactResponseDto> {
    if (!name || name.trim().length === 0) {
      throw new BadRequestException('Client name cannot be empty');
    }

    let client = await this.clientContactRepository.findOne({
      where: { businessId, phone },
    });

    if (!client) {
      // Create new client contact
      client = this.clientContactRepository.create({
        businessId,
        phone,
        name: name.trim(),
      });
    } else {
      // Update existing client
      client.name = name.trim();
    }

    const savedClient = await this.clientContactRepository.save(client);
    return this.formatClientResponse(savedClient);
  }

  async getAllClientsByBusiness(
    businessId: number,
  ): Promise<ClientContactResponseDto[]> {
    const clients = await this.clientContactRepository.find({
      where: { businessId },
      order: { updatedAt: 'DESC' },
    });

    return clients.map((client) => this.formatClientResponse(client));
  }

  async deleteClient(businessId: number, phone: string): Promise<void> {
    const client = await this.clientContactRepository.findOne({
      where: { businessId, phone },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    await this.clientContactRepository.remove(client);
  }

  private formatClientResponse(
    client: ClientContactEntity,
  ): ClientContactResponseDto {
    return {
      id: client.id,
      businessId: client.businessId,
      phone: client.phone,
      name: client.name,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  }
}
