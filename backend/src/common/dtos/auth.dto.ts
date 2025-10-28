import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from 'src/database/entities';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class AuthResponseDto {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  access_token: string;
}

export class UserProfileDto {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  businessId?: number;
  createdAt: Date;
}
