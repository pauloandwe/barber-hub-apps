import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService, UserResponseDto } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/database/entities';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all users (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Users list',
    type: [UserResponseDto],
  })
  async findAll(@Query('role') role?: string): Promise<UserResponseDto[]> {
    if (role) {
      return this.usersService.findByRole(role as UserRole);
    }
    return this.usersService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
  })
  async getMe(@Request() req: any): Promise<UserResponseDto> {
    return this.usersService.findById(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user by ID',
  })
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findById(parseInt(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user profile',
  })
  async update(
    @Param('id') id: string,
    @Body() updateData: any,
    @Request() req: any,
  ): Promise<UserResponseDto> {
    // Users can only update their own profile, unless they're admin
    if (req.user.id !== parseInt(id) && req.user.role !== UserRole.ADMIN) {
      throw new Error('Forbidden: Cannot update other users');
    }

    return this.usersService.update(parseInt(id), updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete user (Admin only)',
  })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.delete(parseInt(id));
    return { message: 'User deleted successfully' };
  }
}
