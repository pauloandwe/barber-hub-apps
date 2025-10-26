import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from 'src/database/entities';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  nome: string;

  @IsString()
  @IsOptional()
  telefone?: string;

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
  nome: string;
  telefone: string;
  role: UserRole;
  access_token: string;
}

export class UserProfileDto {
  id: number;
  email: string;
  nome: string;
  telefone: string;
  role: UserRole;
  barbearia_id?: number;
  created_at: Date;
}
