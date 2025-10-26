import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BloqueiosService, CreateBloqueioDto, BloqueioResponseDto } from './bloqueios.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/database/entities';

@ApiTags('Bloqueios')
@Controller('bloqueios')
export class BloqueiosController {
  constructor(private bloqueiosService: BloqueiosService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BARBEARIA)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new bloqueio (time block)',
    description: 'Creates a new time block for a barber',
  })
  @ApiResponse({
    status: 201,
    description: 'Bloqueio created successfully',
    type: BloqueioResponseDto,
  })
  async create(@Body() createBloqueioDto: CreateBloqueioDto): Promise<BloqueioResponseDto> {
    return this.bloqueiosService.create(createBloqueioDto);
  }

  @Get('barbeiro/:barbeiro_id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get bloqueios for a barber',
  })
  @ApiResponse({
    status: 200,
    description: 'Bloqueios retrieved',
    type: [BloqueioResponseDto],
  })
  async findByBarbeiro(
    @Param('barbeiro_id') barbeiro_id: string,
  ): Promise<BloqueioResponseDto[]> {
    return this.bloqueiosService.findByBarbeiro(parseInt(barbeiro_id));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get bloqueio by ID',
  })
  async findById(@Param('id') id: string): Promise<BloqueioResponseDto> {
    return this.bloqueiosService.findById(parseInt(id));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BARBEARIA)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a bloqueio',
  })
  @ApiResponse({
    status: 200,
    description: 'Bloqueio deleted successfully',
  })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.bloqueiosService.delete(parseInt(id));
    return { message: 'Bloqueio deleted successfully' };
  }
}
