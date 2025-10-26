import { Controller, Get, Post, Body, Param, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { BusinessResponseDto } from 'src/common/dtos/business-response.dto';
import { RegisterDto, LoginDto, AuthResponseDto, UserProfileDto } from 'src/common/dtos/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account with email and password',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or email already registered',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticates user and returns JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns profile information of authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getMe(@Request() req: any): Promise<UserProfileDto> {
    // JWT payload is attached to request by JwtAuthGuard
    return this.authService.getProfile(req.user?.id);
  }

  @Get(':businessId/:phone')
  @ApiOperation({
    summary: 'Get business information and authentication token',
    description:
      'Retrieves business details including working hours, services, barbers, and settings',
  })
  @ApiResponse({
    status: 200,
    description: 'Business found and returned successfully',
    type: BusinessResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
  })
  async getBusiness(
    @Param('businessId') businessId: string,
    @Param('phone') phone: string,
  ): Promise<BusinessResponseDto> {
    try {
      return await this.authService.getBusiness(businessId, phone);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
