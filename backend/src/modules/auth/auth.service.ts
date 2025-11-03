import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  BusinessEntity,
  ProfileEntity,
  UserRole,
  ClientContactEntity,
} from 'src/database/entities';
import { BusinessResponseDto, BusinessDataDto } from 'src/common/dtos/business-response.dto';
import { RegisterDto, LoginDto, AuthResponseDto, UserProfileDto } from 'src/common/dtos/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(BusinessEntity)
    private businessRepository: Repository<BusinessEntity>,
    @InjectRepository(ProfileEntity)
    private profileRepository: Repository<ProfileEntity>,
    @InjectRepository(ClientContactEntity)
    private clientContactRepository: Repository<ClientContactEntity>,
    private jwtService: JwtService,
  ) {}

  async getBusiness(businessId: string, phone: string): Promise<BusinessResponseDto> {
    const business = await this.businessRepository.findOne({
      where: {
        phone: businessId,
      },
      relations: ['services', 'settings'],
    });

    if (!business) {
      throw new Error('Business not found');
    }

    const profile = await this.profileRepository.findOne({
      where: {
        businessId: business.id,
        role: UserRole.BUSINESS,
      },
    });

    let clientName: string | null = null;
    try {
      const clientContact = await this.clientContactRepository.findOne({
        where: {
          businessId: business.id,
          phone,
        },
      });
      clientName = clientContact?.name || null;
    } catch (err) {
      console.warn('[AuthService] Failed to fetch client name:', err);
    }

    const tokenPayload = {
      id: profile?.id ?? business.id,
      email: profile?.email ?? `${business.phone}@barberhub.local`,
      role: profile?.role ?? UserRole.BUSINESS,
      businessId: business.id,
      phone: profile?.phone ?? business.phone,
    };

    const accessToken = this.jwtService.sign(tokenPayload);

    const businessData = this.formatBusinessResponse(business, accessToken, clientName);

    return {
      data: {
        data: businessData,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.profileRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const newProfile = this.profileRepository.create({
      email: registerDto.email,
      passwordHash,
      name: registerDto.name,
      phone: registerDto.phone ?? undefined,
      role: registerDto.role || UserRole.CLIENT,
    });

    const savedProfile = await this.profileRepository.save(newProfile);

    const access_token = this.jwtService.sign({
      id: savedProfile.id,
      email: savedProfile.email,
      role: savedProfile.role,
    });

    return {
      id: savedProfile.id,
      email: savedProfile.email,
      name: savedProfile.name,
      phone: savedProfile.phone,
      role: savedProfile.role,
      access_token,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.profileRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const access_token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      access_token,
    };
  }

  async getProfile(userId: number): Promise<UserProfileDto> {
    const user = await this.profileRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      businessId: user.businessId,
      createdAt: user.createdAt,
    };
  }

  private formatBusinessResponse(
    business: BusinessEntity,
    accessToken?: string,
    clientName?: string | null,
  ): BusinessDataDto {
    return {
      id: business?.id,
      token: accessToken ?? business?.token,
      name: business?.name,
      phone: business?.phone,
      type: business?.type,
      clientName,
      services:
        business?.services?.map((service) => ({
          id: service.id.toString(),
          name: service.name,
          description: service.description,
          duration: service.duration,
          price: parseFloat(service.price.toString()),
          active: service.active,
        })) ?? [],
      settings: {
        reminderHours: business?.settings?.reminderHours?.map((h) => parseInt(h)) || [],
        enableReminders: business?.settings?.enableReminders,
        allowCancellation: business?.settings?.allowCancellation,
        cancellationDeadlineHours: business?.settings?.cancellationDeadlineHours,
        allowReschedule: business?.settings?.allowReschedule,
        rescheduleDeadlineHours: business?.settings?.rescheduleDeadlineHours,
        autoConfirmAppointments: business?.settings?.autoConfirmAppointments,
      },
    };
  }
}
