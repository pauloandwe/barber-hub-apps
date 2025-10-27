import { IsString, IsNumber, IsOptional, IsBoolean, IsDecimal } from 'class-validator';

export class CreateServiceDto {
  @IsNumber()
  businessId: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  duration: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ServiceResponseDto {
  id: number;
  businessId: number;
  name: string;
  description?: string;
  duration: number;
  price: number;
  active: boolean;
  createdAt: Date;
}
