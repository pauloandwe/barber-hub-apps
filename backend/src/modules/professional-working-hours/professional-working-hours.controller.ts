import { Body, Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProfessionalWorkingHoursService } from './professional-working-hours.service';
import {
  ProfessionalWorkingHoursResponseDto,
  UpsertProfessionalWorkingHoursDto,
} from '../../common/dtos/professional-working-hours.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities';

@ApiTags('Professional Working Hours')
@Controller('professionals/:professionalId/working-hours')
export class ProfessionalWorkingHoursController {
  constructor(private readonly workingHoursService: ProfessionalWorkingHoursService) {}

  @Get()
  @ApiOperation({ summary: 'Get working hours for a professional' })
  @ApiResponse({
    status: 200,
    description: 'Working hours retrieved successfully',
    type: [ProfessionalWorkingHoursResponseDto],
  })
  async findByProfessional(@Param('professionalId') professionalId: string) {
    const records = await this.workingHoursService.findByProfessional(parseInt(professionalId, 10));
    return records.map((record) => this.toResponse(record));
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update working hours for a professional' })
  @ApiResponse({
    status: 200,
    description: 'Working hours saved successfully',
    type: [ProfessionalWorkingHoursResponseDto],
  })
  async upsertForProfessional(
    @Param('professionalId') professionalId: string,
    @Body() upsertDto: UpsertProfessionalWorkingHoursDto,
  ) {
    const records = await this.workingHoursService.replaceForProfessional(
      parseInt(professionalId, 10),
      upsertDto.items,
    );

    return records.map((record) => this.toResponse(record));
  }

  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete working hours for a professional' })
  @ApiResponse({
    status: 200,
    description: 'Working hours deleted successfully',
  })
  async deleteForProfessional(@Param('professionalId') professionalId: string) {
    await this.workingHoursService.deleteForProfessional(parseInt(professionalId, 10));
    return { message: 'Working hours deleted successfully' };
  }

  private toResponse(record: ProfessionalWorkingHoursResponseDto): ProfessionalWorkingHoursResponseDto {
    return {
      id: record.id,
      professionalId: record.professionalId,
      dayOfWeek: record.dayOfWeek,
      openTime: record.openTime,
      closeTime: record.closeTime,
      breakStart: record.breakStart,
      breakEnd: record.breakEnd,
      closed: record.closed,
    };
  }
}
