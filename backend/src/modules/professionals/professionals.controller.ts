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
import { ProfessionalsService } from './professionals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities/profile.entity';
import { CreateProfessionalDto, UpdateProfessionalDto, ProfessionalResponseDto } from '../../common/dtos/professional.dto';

@ApiTags('Professionals')
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all professionals' })
  @ApiResponse({
    status: 200,
    description: 'List of professionals',
    type: [ProfessionalResponseDto],
  })
  async findAll(
    @Query('businessId') businessId?: string,
    @Query('businessPhone') businessPhone?: string,
  ): Promise<any> {
    const professionals = await this.professionalsService.findAll({
      businessId: businessId ? parseInt(businessId) : undefined,
      businessPhone,
    });

    return {
      data: {
        data: professionals.map((b) => ({
          id: b.id,
          businessId: b.businessId,
          name: b.name,
          phone: b.specialties ? (b.specialties as any).phone : undefined,
          specialties: b.specialties,
          active: b.active,
          createdAt: b.createdAt,
        })),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get professional by ID' })
  @ApiResponse({
    status: 200,
    description: 'Professional details',
    type: ProfessionalResponseDto,
  })
  async findById(@Param('id') id: string): Promise<any> {
    const professional = await this.professionalsService.findById(parseInt(id));
    return {
      data: {
        id: professional.id,
        businessId: professional.businessId,
        name: professional.name,
        phone: professional.specialties ? (professional.specialties as any).phone : undefined,
        specialties: professional.specialties,
        active: professional.active,
        createdAt: professional.createdAt,
      },
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new professional' })
  @ApiResponse({
    status: 201,
    description: 'Professional created successfully',
    type: ProfessionalResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBarberDto: CreateProfessionalDto): Promise<any> {
    const professional = await this.professionalsService.create(createBarberDto);
    return {
      data: {
        id: professional.id,
        businessId: professional.businessId,
        name: professional.name,
        phone: professional.specialties ? (professional.specialties as any).phone : undefined,
        specialties: professional.specialties,
        active: professional.active,
        createdAt: professional.createdAt,
      },
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a professional' })
  @ApiResponse({
    status: 200,
    description: 'Professional updated successfully',
    type: ProfessionalResponseDto,
  })
  async update(@Param('id') id: string, @Body() updateBarberDto: UpdateProfessionalDto): Promise<any> {
    const professional = await this.professionalsService.update(parseInt(id), updateBarberDto);
    return {
      data: {
        id: professional.id,
        businessId: professional.businessId,
        name: professional.name,
        phone: professional.specialties ? (professional.specialties as any).phone : undefined,
        specialties: professional.specialties,
        active: professional.active,
        createdAt: professional.createdAt,
      },
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a professional' })
  @ApiResponse({
    status: 200,
    description: 'Professional deleted successfully',
  })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.professionalsService.delete(parseInt(id));
    return { message: 'Professional deleted successfully' };
  }
}
