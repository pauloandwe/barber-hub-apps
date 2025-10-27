import { IsString, IsNumber, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateBarberDto {
  @IsNumber()
  businessId: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}

export class UpdateBarberDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class BarberResponseDto {
  id: number;
  businessId: number;
  name: string;
  phone?: string;
  specialties?: string[];
  active: boolean;
  createdAt: Date;
}
