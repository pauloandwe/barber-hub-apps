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

  @Get('phone/:phone/barbers')
  @ApiOperation({ summary: 'Get barbers by business phone' })
  async findBarbersByPhone(@Param('phone') phone: string) {
    return await this.businessService.findBarbersByPhone(phone);
  }

  @Get('phone/:phone/free-slots')
  @ApiOperation({ summary: 'Get available slots for all barbers by business phone' })
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

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BARBERSHOP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new business' })
  async create(@Body() createBusinessDto: CreateBusinessDto) {
    return await this.businessService.create(createBusinessDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BARBERSHOP)
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
