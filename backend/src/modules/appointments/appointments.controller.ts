import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  SuggestAppointmentDto,
  AppointmentResponseDto,
} from 'src/common/dtos/appointment.dto';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post('suggest')
  @ApiOperation({
    summary: 'Get appointment suggestions',
    description: 'Returns suggestions for completing the appointment draft',
  })
  @ApiResponse({
    status: 200,
    description: 'Suggestions returned successfully',
  })
  async suggestAppointments(
    @Body() suggestAppointmentDto: SuggestAppointmentDto,
  ): Promise<{ data: any }> {
    return this.appointmentsService.suggestAppointments(suggestAppointmentDto);
  }

  @Post(':businessId/appointments')
  @ApiOperation({
    summary: 'Create a new appointment',
    description: 'Creates a new appointment for a business',
  })
  @ApiResponse({
    status: 201,
    description: 'Appointment created successfully',
    type: AppointmentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or time slot conflict',
  })
  async createAppointment(
    @Param('businessId') businessId: string,
    @Body(new ValidationPipe()) createAppointmentDto: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    try {
      // Ensure businessId matches
      if (parseInt(businessId) !== createAppointmentDto.businessId) {
        throw new BadRequestException('Business ID mismatch');
      }

      return await this.appointmentsService.create(createAppointmentDto);
    } catch (error) {
      throw error;
    }
  }

  @Put(':businessId/appointments/:appointmentId')
  @ApiOperation({
    summary: 'Update an appointment completely',
    description: 'Updates all fields of an appointment',
  })
  @ApiResponse({
    status: 200,
    description: 'Appointment updated successfully',
    type: AppointmentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Appointment not found',
  })
  async updateAppointment(
    @Param('businessId') businessId: string,
    @Param('appointmentId') appointmentId: string,
    @Body(new ValidationPipe()) updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    try {
      return await this.appointmentsService.update(
        parseInt(appointmentId),
        parseInt(businessId),
        updateAppointmentDto,
      );
    } catch (error) {
      throw error;
    }
  }

  @Patch(':businessId/appointments/:appointmentId')
  @ApiOperation({
    summary: 'Partially update an appointment',
    description: 'Updates only provided fields of an appointment',
  })
  @ApiResponse({
    status: 200,
    description: 'Appointment updated successfully',
    type: AppointmentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Appointment not found',
  })
  async partialUpdateAppointment(
    @Param('businessId') businessId: string,
    @Param('appointmentId') appointmentId: string,
    @Body(new ValidationPipe()) updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    try {
      return await this.appointmentsService.partialUpdate(
        parseInt(appointmentId),
        parseInt(businessId),
        updateAppointmentDto,
      );
    } catch (error) {
      throw error;
    }
  }

  @Delete(':businessId/appointments/:appointmentId')
  @ApiOperation({
    summary: 'Delete an appointment',
    description: 'Deletes an appointment by ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Appointment deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Appointment not found',
  })
  async deleteAppointment(
    @Param('businessId') businessId: string,
    @Param('appointmentId') appointmentId: string,
  ): Promise<{ message: string }> {
    try {
      await this.appointmentsService.delete(parseInt(appointmentId), parseInt(businessId));
      return { message: 'Appointment deleted successfully' };
    } catch (error) {
      throw error;
    }
  }
}
