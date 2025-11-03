import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UnavailabilityService, CreateUnavailabilityDto, UnavailabilityResponseDto } from './unavailability.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/database/entities';

@ApiTags('Unavailability')
@Controller('unavailability')
export class UnavailabilityController {
  constructor(private unavailabilityService: UnavailabilityService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new unavailability (time block)',
    description: 'Creates a new time block for a professional',
  })
  @ApiResponse({
    status: 201,
    description: 'Unavailability created successfully',
    type: UnavailabilityResponseDto,
  })
  async create(@Body() createUnavailabilityDto: CreateUnavailabilityDto): Promise<UnavailabilityResponseDto> {
    return this.unavailabilityService.create(createUnavailabilityDto);
  }

  @Get('professional/:professional_id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get unavailability for a professional',
  })
  @ApiResponse({
    status: 200,
    description: 'Unavailability retrieved',
    type: [UnavailabilityResponseDto],
  })
  async findByProfessional(@Param('professional_id') professional_id: string): Promise<UnavailabilityResponseDto[]> {
    return this.unavailabilityService.findByProfessional(parseInt(professional_id));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get unavailability by ID',
  })
  async findById(@Param('id') id: string): Promise<UnavailabilityResponseDto> {
    return this.unavailabilityService.findById(parseInt(id));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BUSINESS)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a unavailability',
  })
  @ApiResponse({
    status: 200,
    description: 'Unavailability deleted successfully',
  })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.unavailabilityService.delete(parseInt(id));
    return { message: 'Unavailability deleted successfully' };
  }
}
