import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ReminderLogEntity, ReminderStatus, ReminderType } from '../../database/entities';

export interface ReminderAnalytics {
  totalReminders: number;
  sentReminders: number;
  deliveredReminders: number;
  readReminders: number;
  failedReminders: number;
  sendRate: number;
  deliveryRate: number;
  readRate: number;
  byType: Record<string, ReminderTypeAnalytics>;
  byStatus: Record<string, number>;
  lastSevenDays: DailyAnalytics[];
}

export interface ReminderTypeAnalytics {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

export interface DailyAnalytics {
  date: string;
  total: number;
  sent: number;
  delivered: number;
}

@Injectable()
export class ReminderAnalyticsService {
  constructor(
    @InjectRepository(ReminderLogEntity)
    private reminderLogRepository: Repository<ReminderLogEntity>,
  ) {}

  async getAnalyticsForBusiness(businessId: number): Promise<ReminderAnalytics> {
    const logs = await this.reminderLogRepository.find({
      relations: ['appointment'],
    });

    const filteredLogs = logs.filter((log) => log.appointment?.businessId === businessId);

    const totalReminders = filteredLogs.length;
    const sentReminders = filteredLogs.filter(
      (l) => l.status === ReminderStatus.SENT || l.status === ReminderStatus.DELIVERED,
    ).length;
    const deliveredReminders = filteredLogs.filter(
      (l) => l.status === ReminderStatus.DELIVERED || l.status === ReminderStatus.READ,
    ).length;
    const readReminders = filteredLogs.filter((l) => l.status === ReminderStatus.READ).length;
    const failedReminders = filteredLogs.filter((l) => l.status === ReminderStatus.FAILED).length;

    const sendRate = totalReminders > 0 ? (sentReminders / totalReminders) * 100 : 0;
    const deliveryRate = totalReminders > 0 ? (deliveredReminders / totalReminders) * 100 : 0;
    const readRate = totalReminders > 0 ? (readReminders / totalReminders) * 100 : 0;

    const byType = this.analyzeByType(filteredLogs);
    const byStatus = this.analyzeByStatus(filteredLogs);
    const lastSevenDays = this.analyzeLastSevenDays(filteredLogs);

    return {
      totalReminders,
      sentReminders,
      deliveredReminders,
      readReminders,
      failedReminders,
      sendRate,
      deliveryRate,
      readRate,
      byType,
      byStatus,
      lastSevenDays,
    };
  }

  private analyzeByType(logs: ReminderLogEntity[]): Record<string, ReminderTypeAnalytics> {
    const byType: Record<string, ReminderTypeAnalytics> = {};

    Object.values(ReminderType).forEach((type) => {
      const typeLogs = logs.filter((l) => l.type === type);
      byType[type] = {
        total: typeLogs.length,
        sent: typeLogs.filter(
          (l) => l.status === ReminderStatus.SENT || l.status === ReminderStatus.DELIVERED,
        ).length,
        delivered: typeLogs.filter(
          (l) => l.status === ReminderStatus.DELIVERED || l.status === ReminderStatus.READ,
        ).length,
        read: typeLogs.filter((l) => l.status === ReminderStatus.READ).length,
        failed: typeLogs.filter((l) => l.status === ReminderStatus.FAILED).length,
      };
    });

    return byType;
  }

  private analyzeByStatus(logs: ReminderLogEntity[]): Record<string, number> {
    const byStatus: Record<string, number> = {};

    Object.values(ReminderStatus).forEach((status) => {
      byStatus[status] = logs.filter((l) => l.status === status).length;
    });

    return byStatus;
  }

  private analyzeLastSevenDays(logs: ReminderLogEntity[]): DailyAnalytics[] {
    const daily: Record<string, DailyAnalytics> = {};
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      daily[dateStr] = {
        date: dateStr,
        total: 0,
        sent: 0,
        delivered: 0,
      };
    }

    logs.forEach((log) => {
      if (!log.createdAt) return;
      const dateStr = new Date(log.createdAt).toISOString().split('T')[0];

      if (daily[dateStr]) {
        daily[dateStr].total++;
        if (log.status === ReminderStatus.SENT || log.status === ReminderStatus.DELIVERED) {
          daily[dateStr].sent++;
        }
        if (log.status === ReminderStatus.DELIVERED || log.status === ReminderStatus.READ) {
          daily[dateStr].delivered++;
        }
      }
    });

    return Object.values(daily).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }
}
