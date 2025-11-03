import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfessionalWorkingHoursEntity, ProfessionalEntity } from '../../database/entities';
import { ProfessionalWorkingHourItemDto } from '../../common/dtos/professional-working-hours.dto';

@Injectable()
export class ProfessionalWorkingHoursService {
  constructor(
    @InjectRepository(ProfessionalWorkingHoursEntity)
    private readonly workingHoursRepository: Repository<ProfessionalWorkingHoursEntity>,
    @InjectRepository(ProfessionalEntity)
    private readonly professionalRepository: Repository<ProfessionalEntity>,
  ) {}

  async findByProfessional(professionalId: number): Promise<ProfessionalWorkingHoursEntity[]> {
    await this.ensureProfessionalExists(professionalId);
    return this.workingHoursRepository.find({
      where: { professionalId },
      order: { dayOfWeek: 'ASC' },
    });
  }

  async replaceForProfessional(
    professionalId: number,
    items: ProfessionalWorkingHourItemDto[],
  ): Promise<ProfessionalWorkingHoursEntity[]> {
    await this.ensureProfessionalExists(professionalId);

    const normalized = this.normalizeItems(items ?? []);

    await this.workingHoursRepository.delete({ professionalId });

    const entities = normalized.map((item) =>
      this.workingHoursRepository.create({
        professionalId,
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

  async deleteForProfessional(professionalId: number): Promise<void> {
    await this.ensureProfessionalExists(professionalId);
    await this.workingHoursRepository.delete({ professionalId });
  }

  private async ensureProfessionalExists(professionalId: number): Promise<void> {
    const professional = await this.professionalRepository.findOne({ where: { id: professionalId } });
    if (!professional) {
      throw new NotFoundException(`Professional with ID ${professionalId} not found`);
    }
  }

  private normalizeItems(items: ProfessionalWorkingHourItemDto[]): ProfessionalWorkingHourItemDto[] {
    const byDay = new Map<number, ProfessionalWorkingHourItemDto>();

    for (const item of items || []) {
      const day = item.dayOfWeek;
      if (byDay.has(day)) {
        throw new BadRequestException(`Duplicated working hours entry for day ${day}`);
      }
      byDay.set(day, { ...item });
    }

    const normalized: ProfessionalWorkingHourItemDto[] = [];
    for (let day = 0; day < 7; day++) {
      const entry = byDay.get(day) ?? { dayOfWeek: day, closed: true };
      normalized.push(this.validateEntry(entry));
    }

    return normalized.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }

  private validateEntry(entry: ProfessionalWorkingHourItemDto): ProfessionalWorkingHourItemDto {
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
