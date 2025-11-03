import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class ProfessionalWorkingHourItemDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsOptional()
  @Matches(TIME_REGEX, { message: 'openTime must be in the format HH:mm' })
  openTime?: string;

  @IsOptional()
  @Matches(TIME_REGEX, { message: 'closeTime must be in the format HH:mm' })
  closeTime?: string;

  @IsOptional()
  @Matches(TIME_REGEX, { message: 'breakStart must be in the format HH:mm' })
  breakStart?: string;

  @IsOptional()
  @Matches(TIME_REGEX, { message: 'breakEnd must be in the format HH:mm' })
  breakEnd?: string;

  @IsBoolean()
  closed: boolean;
}

export class UpsertProfessionalWorkingHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfessionalWorkingHourItemDto)
  items: ProfessionalWorkingHourItemDto[];
}

export class ProfessionalWorkingHoursResponseDto {
  id: number;
  professionalId: number;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  closed: boolean;
}

