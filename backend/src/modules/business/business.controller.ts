import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
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

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BARBEARIA)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new business' })
  async create(@Body() createBusinessDto: CreateBusinessDto) {
    return await this.businessService.create(createBusinessDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BARBEARIA)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a business' })
  async update(
    @Param('id') id: number,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
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
