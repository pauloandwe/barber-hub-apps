import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileEntity, UserRole } from 'src/database/entities';

export class UserResponseDto {
  id: number;
  email: string;
  nome: string;
  telefone: string;
  role: UserRole;
  barbearia_id?: number;
  created_at: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(ProfileEntity)
    private profileRepository: Repository<ProfileEntity>,
  ) {}

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.profileRepository.find({
      order: { createdAt: 'DESC' },
    });

    return users.map((u) => this.formatUserResponse(u));
  }

  async findById(id: number): Promise<UserResponseDto> {
    const user = await this.profileRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatUserResponse(user);
  }

  async findByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.profileRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatUserResponse(user);
  }

  async findByRole(role: UserRole): Promise<UserResponseDto[]> {
    const users = await this.profileRepository.find({
      where: { role },
      order: { createdAt: 'DESC' },
    });

    return users.map((u) => this.formatUserResponse(u));
  }

  async update(id: number, updateData: any): Promise<UserResponseDto> {
    const user = await this.profileRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Don't allow changing email to an existing one
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.profileRepository.findOne({
        where: { email: updateData.email },
      });

      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }

    Object.assign(user, updateData);
    const updatedUser = await this.profileRepository.save(user);

    return this.formatUserResponse(updatedUser);
  }

  async delete(id: number): Promise<void> {
    const user = await this.profileRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.profileRepository.remove(user);
  }

  private formatUserResponse(user: ProfileEntity): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      nome: user.name,
      telefone: user.phone,
      role: user.role,
      barbearia_id: user.businessId,
      created_at: user.createdAt,
    };
  }
}
