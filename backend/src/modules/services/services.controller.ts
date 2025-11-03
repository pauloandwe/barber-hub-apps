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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities/profile.entity';
import {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceResponseDto,
} from '../../common/dtos/service.dto';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all services' })
  @ApiResponse({
    status: 200,
    description: 'List of services',
    type: [ServiceResponseDto],
  })
  async findAll(
    @Query('businessId') businessId?: string,
    @Query('businessPhone') businessPhone?: string,
  ): Promise<any> {
    const services = await this.servicesService.findAll({
      businessId: businessId ? parseInt(businessId, 10) : undefined,
      businessPhone,
    });
    return {
      data: {
        data: services.map((s) => ({
          id: s.id,
          businessId: s.businessId,
          name: s.name,
          description: s.description,
          duration: s.duration,
          price: Number(s.price),
          active: s.active,
          createdAt: s.createdAt,
        })),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({
    status: 200,
    description: 'Service details',
    type: ServiceResponseDto,
  })
  async findById(@Param('id') id: string): Promise<any> {
    const service = await this.servicesService.findById(parseInt(id, 10));
    return {
      data: service,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({
    status: 201,
    description: 'Service created successfully',
    type: ServiceResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createServiceDto: CreateServiceDto): Promise<any> {
    const service = await this.servicesService.create(createServiceDto);
    return {
      data: service,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a service' })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully',
    type: ServiceResponseDto,
  })
  async update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto): Promise<any> {
    const service = await this.servicesService.update(parseInt(id, 10), updateServiceDto);
    return {
      data: service,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a service' })
  @ApiResponse({
    status: 200,
    description: 'Service deleted successfully',
  })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.servicesService.delete(parseInt(id, 10));
    return { message: 'Service deleted successfully' };
  }
}
