import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BarberWorkingHoursEntity, BarberEntity } from '../../database/entities';
import { BarberWorkingHourItemDto } from '../../common/dtos/barber-working-hours.dto';

@Injectable()
export class BarberWorkingHoursService {
  constructor(
    @InjectRepository(BarberWorkingHoursEntity)
    private readonly workingHoursRepository: Repository<BarberWorkingHoursEntity>,
    @InjectRepository(BarberEntity)
    private readonly barberRepository: Repository<BarberEntity>,
  ) {}

  async findByBarber(barberId: number): Promise<BarberWorkingHoursEntity[]> {
    await this.ensureBarberExists(barberId);
    return this.workingHoursRepository.find({
      where: { barberId },
      order: { dayOfWeek: 'ASC' },
    });
  }

  async replaceForBarber(
    barberId: number,
    items: BarberWorkingHourItemDto[],
  ): Promise<BarberWorkingHoursEntity[]> {
    await this.ensureBarberExists(barberId);

    const normalized = this.normalizeItems(items ?? []);

    await this.workingHoursRepository.delete({ barberId });

    const entities = normalized.map((item) =>
      this.workingHoursRepository.create({
        barberId,
        dayOfWeek: item.dayOfWeek,
        openTime: item.closed ? null : item.openTime ?? null,
        closeTime: item.closed ? null : item.closeTime ?? null,
        breakStart: item.closed ? null : item.breakStart ?? null,
        breakEnd: item.closed ? null : item.breakEnd ?? null,
        closed: item.closed,
      }),
    );

    return this.workingHoursRepository.save(entities);
  }

  async deleteForBarber(barberId: number): Promise<void> {
    await this.ensureBarberExists(barberId);
    await this.workingHoursRepository.delete({ barberId });
  }

  private async ensureBarberExists(barberId: number): Promise<void> {
    const barber = await this.barberRepository.findOne({ where: { id: barberId } });
    if (!barber) {
      throw new NotFoundException(`Barber with ID ${barberId} not found`);
    }
  }

  private normalizeItems(items: BarberWorkingHourItemDto[]): BarberWorkingHourItemDto[] {
    const byDay = new Map<number, BarberWorkingHourItemDto>();

    for (const item of items || []) {
      const day = item.dayOfWeek;
      if (byDay.has(day)) {
        throw new BadRequestException(`Duplicated working hours entry for day ${day}`);
      }
      byDay.set(day, { ...item });
    }

    const normalized: BarberWorkingHourItemDto[] = [];
    for (let day = 0; day < 7; day++) {
      const entry = byDay.get(day) ?? { dayOfWeek: day, closed: true };
      normalized.push(this.validateEntry(entry));
    }

    return normalized.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }

  private validateEntry(entry: BarberWorkingHourItemDto): BarberWorkingHourItemDto {
    if (entry.closed) {
      return {
        dayOfWeek: entry.dayOfWeek,
        closed: true,
      };
    }

    if (!entry.openTime || !entry.closeTime) {
      throw new BadRequestException(
        `openTime and closeTime are required for day ${entry.dayOfWeek} when not closed`,
      );
    }

    const openMinutes = this.parseTimeToMinutes(entry.openTime);
    const closeMinutes = this.parseTimeToMinutes(entry.closeTime);

    if (closeMinutes <= openMinutes) {
      throw new BadRequestException(
        `closeTime must be after openTime for day ${entry.dayOfWeek}`,
      );
    }

    if ((entry.breakStart && !entry.breakEnd) || (!entry.breakStart && entry.breakEnd)) {
      throw new BadRequestException(
        `Both breakStart and breakEnd must be provided for day ${entry.dayOfWeek}`,
      );
    }

    if (entry.breakStart && entry.breakEnd) {
      const breakStartMinutes = this.parseTimeToMinutes(entry.breakStart);
      const breakEndMinutes = this.parseTimeToMinutes(entry.breakEnd);

      if (breakStartMinutes < openMinutes || breakEndMinutes > closeMinutes) {
        throw new BadRequestException(
          `Break must be within working hours for day ${entry.dayOfWeek}`,
        );
      }

      if (breakEndMinutes <= breakStartMinutes) {
        throw new BadRequestException(
          `breakEnd must be after breakStart for day ${entry.dayOfWeek}`,
        );
      }
    }

    return {
      dayOfWeek: entry.dayOfWeek,
      openTime: entry.openTime,
      closeTime: entry.closeTime,
      breakStart: entry.breakStart,
      breakEnd: entry.breakEnd,
      closed: false,
    };
  }

  private parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0);
  }
}
