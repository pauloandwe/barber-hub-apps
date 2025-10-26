import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  token?: string;
}
