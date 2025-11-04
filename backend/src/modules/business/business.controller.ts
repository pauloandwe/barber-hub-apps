import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BusinessService } from './business.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities/profile.entity';
import { CreateBusinessDto } from '../../common/dtos/create-business.dto';
import { UpdateBusinessDto } from '../../common/dtos/update-business.dto';

@ApiTags('Business')
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  @ApiOperation({ summary: 'Get all businesses' })
  async findAll() {
    return await this.businessService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business by ID' })
  async findById(@Param('id') id: number) {
    return await this.businessService.findById(id);
  }

  @Get('phone/:phone/services')
  @ApiOperation({ summary: 'Get services by business phone' })
  async findServicesByPhone(@Param('phone') phone: string) {
    return await this.businessService.findServicesByPhone(phone);
  }

  @Get('phone/:phone/professionals')
  @ApiOperation({ summary: 'Get professionals by business phone' })
  async findProfessionalsByPhone(@Param('phone') phone: string) {
    return await this.businessService.findProfessionalsByPhone(phone);
  }

  @Get('phone/:phone/free-slots')
  @ApiOperation({ summary: 'Get available slots for all professionals by business phone' })
  async findAvailableSlotsByPhone(
    @Param('phone') phone: string,
    @Query('date') date?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    let parsedServiceId: number | undefined;
    if (serviceId !== undefined) {
      parsedServiceId = Number(serviceId);
      if (Number.isNaN(parsedServiceId)) {
        throw new BadRequestException('serviceId must be a valid number');
      }
    }

    return await this.businessService.findAvailableSlotsByPhone(phone, {
      date,
      serviceId: parsedServiceId,
    });
  }

  @Get('phone/:phone/professionals/:professionalId/free-slots')
  @ApiOperation({ summary: 'Get available slots for a specific professional by business phone' })
  async findProfessionalSlotsByPhone(
    @Param('phone') phone: string,
    @Param('professionalId') professionalId: string,
    @Query('date') date?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    const parsedProfessionalId = Number(professionalId);
    if (Number.isNaN(parsedProfessionalId)) {
      throw new BadRequestException('professionalId must be a valid number');
    }

    let parsedServiceId: number | undefined;
    if (serviceId !== undefined) {
      parsedServiceId = Number(serviceId);
      if (Number.isNaN(parsedServiceId)) {
        throw new BadRequestException('serviceId must be a valid number');
      }
    }

    return await this.businessService.findProfessionalSlotsByPhone(phone, parsedProfessionalId, {
      date,
      serviceId: parsedServiceId,
    });
  }

  @Get('phone/:phone/available-days-aggregated')
  @ApiOperation({ summary: 'Get aggregated available days for all professionals (union of all days with slots)' })
  async findAggregatedAvailableDaysByPhone(
    @Param('phone') phone: string,
    @Query('serviceId') serviceId?: string,
    @Query('days') days: string = '15',
  ) {
    let parsedServiceId: number | undefined;
    if (serviceId !== undefined) {
      parsedServiceId = Number(serviceId);
      if (Number.isNaN(parsedServiceId)) {
        throw new BadRequestException('serviceId must be a valid number');
      }
    }

    const parsedDays = Number(days);
    if (Number.isNaN(parsedDays) || parsedDays < 1 || parsedDays > 365) {
      throw new BadRequestException('days must be a number between 1 and 365');
    }

    return await this.businessService.findAggregatedAvailableDaysByPhone(phone, {
      serviceId: parsedServiceId,
      days: parsedDays,
    });
  }

  @Get('phone/:phone/professionals/:professionalId/available-days')
  @ApiOperation({ summary: 'Get available days for a specific professional (next N days with slots)' })
  async findAvailableDaysByPhone(
    @Param('phone') phone: string,
    @Param('professionalId') professionalId: string,
    @Query('serviceId') serviceId?: string,
    @Query('days') days: string = '15',
  ) {
    const parsedProfessionalId = Number(professionalId);
    if (Number.isNaN(parsedProfessionalId)) {
      throw new BadRequestException('professionalId must be a valid number');
    }

    let parsedServiceId: number | undefined;
    if (serviceId !== undefined) {
      parsedServiceId = Number(serviceId);
      if (Number.isNaN(parsedServiceId)) {
        throw new BadRequestException('serviceId must be a valid number');
      }
    }

    const parsedDays = Number(days);
    if (Number.isNaN(parsedDays) || parsedDays < 1 || parsedDays > 365) {
      throw new BadRequestException('days must be a number between 1 and 365');
    }

    return await this.businessService.findAvailableDaysByPhone(phone, parsedProfessionalId, {
      serviceId: parsedServiceId,
      days: parsedDays,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new business' })
  async create(@Body() createBusinessDto: CreateBusinessDto) {
    return await this.businessService.create(createBusinessDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a business' })
  async update(@Param('id') id: number, @Body() updateBusinessDto: UpdateBusinessDto) {
    return await this.businessService.update(id, updateBusinessDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a business' })
  async delete(@Param('id') id: number) {
    await this.businessService.delete(id);
    return {
      message: 'Business deleted successfully',
    };
  }
}
