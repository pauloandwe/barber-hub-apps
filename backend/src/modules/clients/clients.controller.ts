import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService, ClientContactResponseDto } from './clients.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { IsNotEmpty, IsString } from 'class-validator';

class UpdateClientNameDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}

class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get(':businessId/:phone')
  @ApiOperation({
    summary: 'Get client by phone number',
  })
  @ApiResponse({
    status: 200,
    description: 'Client information',
    type: ClientContactResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Client not found',
  })
  async getClientByPhone(
    @Param('businessId') businessId: string,
    @Param('phone') phone: string,
  ): Promise<ClientContactResponseDto | null> {
    return this.clientsService.getClientByPhone(parseInt(businessId), phone);
  }

  @Post(':businessId/update-name')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create or update client name',
  })
  @ApiResponse({
    status: 200,
    description: 'Client updated successfully',
    type: ClientContactResponseDto,
  })
  async createOrUpdateClientName(
    @Param('businessId') businessId: string,
    @Body() updateData: UpdateClientNameDto,
  ): Promise<ClientContactResponseDto> {
    if (!updateData.phone) {
      throw new BadRequestException('Phone number is required in body');
    }

    return this.clientsService.createOrUpdateClientName(
      parseInt(businessId),
      updateData.phone,
      updateData.name,
    );
  }

  @Post(':businessId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new client',
  })
  @ApiResponse({
    status: 201,
    description: 'Client created successfully',
    type: ClientContactResponseDto,
  })
  async createClient(
    @Param('businessId') businessId: string,
    @Body() createData: CreateClientDto,
  ): Promise<ClientContactResponseDto> {
    return this.clientsService.createOrUpdateClientName(
      parseInt(businessId),
      createData.phone,
      createData.name,
    );
  }

  @Get(':businessId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all clients for a business',
  })
  @ApiResponse({
    status: 200,
    description: 'List of clients',
    type: [ClientContactResponseDto],
  })
  async getAllClientsByBusiness(
    @Param('businessId') businessId: string,
  ): Promise<ClientContactResponseDto[]> {
    return this.clientsService.getAllClientsByBusiness(parseInt(businessId));
  }

  @Delete(':businessId/:phone')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete client',
  })
  async deleteClient(
    @Param('businessId') businessId: string,
    @Param('phone') phone: string,
  ): Promise<{ message: string }> {
    await this.clientsService.deleteClient(parseInt(businessId), phone);
    return { message: 'Client deleted successfully' };
  }
}
