import { IsString, IsNumber, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateProfessionalDto {
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

export class UpdateProfessionalDto {
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

export class ProfessionalResponseDto {
  id: number;
  businessId: number;
  name: string;
  phone?: string;
  specialties?: string[];
  active: boolean;
  createdAt: Date;
}
