import { Body, Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BarberWorkingHoursService } from './barber-working-hours.service';
import {
  BarberWorkingHoursResponseDto,
  UpsertBarberWorkingHoursDto,
} from '../../common/dtos/barber-working-hours.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities';

@ApiTags('Barber Working Hours')
@Controller('barbers/:barberId/working-hours')
export class BarberWorkingHoursController {
  constructor(private readonly workingHoursService: BarberWorkingHoursService) {}

  @Get()
  @ApiOperation({ summary: 'Get working hours for a barber' })
  @ApiResponse({
    status: 200,
    description: 'Working hours retrieved successfully',
    type: [BarberWorkingHoursResponseDto],
  })
  async findByBarber(@Param('barberId') barberId: string) {
    const records = await this.workingHoursService.findByBarber(parseInt(barberId, 10));
    return records.map((record) => this.toResponse(record));
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BARBERSHOP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update working hours for a barber' })
  @ApiResponse({
    status: 200,
    description: 'Working hours saved successfully',
    type: [BarberWorkingHoursResponseDto],
  })
  async upsertForBarber(
    @Param('barberId') barberId: string,
    @Body() upsertDto: UpsertBarberWorkingHoursDto,
  ) {
    const records = await this.workingHoursService.replaceForBarber(
      parseInt(barberId, 10),
      upsertDto.items,
    );

    return records.map((record) => this.toResponse(record));
  }

  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BARBERSHOP)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete working hours for a barber' })
  @ApiResponse({
    status: 200,
    description: 'Working hours deleted successfully',
  })
  async deleteForBarber(@Param('barberId') barberId: string) {
    await this.workingHoursService.deleteForBarber(parseInt(barberId, 10));
    return { message: 'Working hours deleted successfully' };
  }

  private toResponse(record: BarberWorkingHoursResponseDto): BarberWorkingHoursResponseDto {
    return {
      id: record.id,
      barberId: record.barberId,
      dayOfWeek: record.dayOfWeek,
      openTime: record.openTime,
      closeTime: record.closeTime,
      breakStart: record.breakStart,
      breakEnd: record.breakEnd,
      closed: record.closed,
    };
  }
}
