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

export class BarberWorkingHourItemDto {
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

export class UpsertBarberWorkingHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BarberWorkingHourItemDto)
  items: BarberWorkingHourItemDto[];
}

export class BarberWorkingHoursResponseDto {
  id: number;
  barberId: number;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  closed: boolean;
}

