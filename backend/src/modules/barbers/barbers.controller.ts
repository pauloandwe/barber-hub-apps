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
import { BarbersService } from './barbers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities/profile.entity';
import { CreateBarberDto, UpdateBarberDto, BarberResponseDto } from '../../common/dtos/barber.dto';

@ApiTags('Barbers')
@Controller('barbers')
export class BarbersController {
  constructor(private readonly barbersService: BarbersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all barbers' })
  @ApiResponse({
    status: 200,
    description: 'List of barbers',
    type: [BarberResponseDto],
  })
  async findAll(
    @Query('businessId') businessId?: string,
    @Query('businessPhone') businessPhone?: string,
  ): Promise<any> {
    const barbers = await this.barbersService.findAll({
      businessId: businessId ? parseInt(businessId) : undefined,
      businessPhone,
    });

    return {
      data: {
        data: barbers.map((b) => ({
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
  @ApiOperation({ summary: 'Get barber by ID' })
  @ApiResponse({
    status: 200,
    description: 'Barber details',
    type: BarberResponseDto,
  })
  async findById(@Param('id') id: string): Promise<any> {
    const barber = await this.barbersService.findById(parseInt(id));
    return {
      data: {
        id: barber.id,
        businessId: barber.businessId,
        name: barber.name,
        phone: barber.specialties ? (barber.specialties as any).phone : undefined,
        specialties: barber.specialties,
        active: barber.active,
        createdAt: barber.createdAt,
      },
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BARBERSHOP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new barber' })
  @ApiResponse({
    status: 201,
    description: 'Barber created successfully',
    type: BarberResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBarberDto: CreateBarberDto): Promise<any> {
    const barber = await this.barbersService.create(createBarberDto);
    return {
      data: {
        id: barber.id,
        businessId: barber.businessId,
        name: barber.name,
        phone: barber.specialties ? (barber.specialties as any).phone : undefined,
        specialties: barber.specialties,
        active: barber.active,
        createdAt: barber.createdAt,
      },
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BARBERSHOP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a barber' })
  @ApiResponse({
    status: 200,
    description: 'Barber updated successfully',
    type: BarberResponseDto,
  })
  async update(@Param('id') id: string, @Body() updateBarberDto: UpdateBarberDto): Promise<any> {
    const barber = await this.barbersService.update(parseInt(id), updateBarberDto);
    return {
      data: {
        id: barber.id,
        businessId: barber.businessId,
        name: barber.name,
        phone: barber.specialties ? (barber.specialties as any).phone : undefined,
        specialties: barber.specialties,
        active: barber.active,
        createdAt: barber.createdAt,
      },
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BARBERSHOP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a barber' })
  @ApiResponse({
    status: 200,
    description: 'Barber deleted successfully',
  })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.barbersService.delete(parseInt(id));
    return { message: 'Barber deleted successfully' };
  }
}
