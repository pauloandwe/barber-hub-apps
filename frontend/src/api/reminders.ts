import { apiClient } from "./client";

// ============== TYPES ==============

export enum ReminderType {
  CONFIRMATION = "CONFIRMATION",
  PRE_APPOINTMENT = "PRE_APPOINTMENT",
  POST_APPOINTMENT = "POST_APPOINTMENT",
  RESCHEDULING = "RESCHEDULING",
}

export enum ReminderStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  FAILED = "FAILED",
}

export interface ReminderSettings {
  id: number;
  businessId: number;
  type: ReminderType;
  enabled: boolean;
  hoursBeforeAppointment: number[];
  timezone: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReminderTemplate {
  id: number;
  businessId: number;
  type: ReminderType;
  message: string;
  variables: string[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReminderLog {
  id: number;
  appointmentId: number;
  clientContactId: number;
  type: ReminderType;
  status: ReminderStatus;
  scheduledAt: string;
  sentAt?: string;
  messageId?: string;
  message: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderAnalytics {
  totalReminders: number;
  sentReminders: number;
  deliveredReminders: number;
  readReminders: number;
  failedReminders: number;
  sendRate: number;
  deliveryRate: number;
  readRate: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  last7Days: Array<{
    date: string;
    count: number;
    sent: number;
    delivered: number;
  }>;
}

export interface CreateReminderSettingsRequest {
  type: ReminderType;
  enabled: boolean;
  hoursBeforeAppointment: number[];
  timezone: string;
}

export interface UpdateReminderSettingsRequest {
  enabled?: boolean;
  hoursBeforeAppointment?: number[];
  timezone?: string;
}

export interface CreateReminderTemplateRequest {
  type: ReminderType;
  message: string;
  active: boolean;
}

export interface UpdateReminderTemplateRequest {
  message?: string;
  active?: boolean;
}

export interface PaginatedLogsResponse {
  data: ReminderLog[];
  pagination: {
    total: number;
    skip: number;
    take: number;
  };
}

// ============== API FUNCTIONS ==============

export const remindersAPI = {
  // ===== SETTINGS =====
  async getSettings(businessId: number): Promise<ReminderSettings[]> {
    const response = await apiClient.get(
      `/reminders/settings/${businessId}`
    );
    return response?.data?.data || [];
  },

  async createSettings(
    businessId: number,
    data: CreateReminderSettingsRequest
  ): Promise<ReminderSettings> {
    const response = await apiClient.post(
      `/reminders/settings/${businessId}`,
      data
    );
    return response?.data?.data;
  },

  async updateSettings(
    id: number,
    data: UpdateReminderSettingsRequest
  ): Promise<ReminderSettings> {
    const response = await apiClient.put(
      `/reminders/settings/${id}`,
      data
    );
    return response?.data?.data;
  },

  async toggleSettings(id: number, enabled: boolean): Promise<ReminderSettings> {
    const response = await apiClient.put(
      `/reminders/settings/${id}/toggle`,
      { enabled }
    );
    return response?.data?.data;
  },

  async deleteSettings(id: number): Promise<void> {
    await apiClient.delete(`/reminders/settings/${id}`);
  },

  // ===== TEMPLATES =====
  async getTemplates(businessId: number): Promise<ReminderTemplate[]> {
    const response = await apiClient.get(
      `/reminders/templates/${businessId}`
    );
    return response?.data?.data || [];
  },

  async getTemplate(id: number): Promise<ReminderTemplate> {
    const response = await apiClient.get(
      `/reminders/templates/detail/${id}`
    );
    return response?.data?.data;
  },

  async createTemplate(
    businessId: number,
    data: CreateReminderTemplateRequest
  ): Promise<ReminderTemplate> {
    const response = await apiClient.post(
      `/reminders/templates/${businessId}`,
      data
    );
    return response?.data?.data;
  },

  async updateTemplate(
    id: number,
    data: UpdateReminderTemplateRequest
  ): Promise<ReminderTemplate> {
    const response = await apiClient.put(
      `/reminders/templates/${id}`,
      data
    );
    return response?.data?.data;
  },

  async deleteTemplate(id: number): Promise<void> {
    await apiClient.delete(`/reminders/templates/${id}`);
  },

  async resetTemplate(id: number): Promise<ReminderTemplate> {
    const response = await apiClient.post(
      `/reminders/templates/${id}/reset`
    );
    return response?.data?.data;
  },

  // ===== LOGS & ANALYTICS =====
  async getLogs(
    businessId: number,
    skip: number = 0,
    take: number = 20
  ): Promise<PaginatedLogsResponse> {
    const response = await apiClient.get(
      `/reminders/logs/${businessId}?skip=${skip}&take=${take}`
    );
    const payload = response?.data || {};
    const pagination = payload?.pagination || {};

    return {
      data: Array.isArray(payload?.data) ? payload.data : [],
      pagination: {
        total: typeof pagination?.total === "number" ? pagination.total : 0,
        skip: typeof pagination?.skip === "number" ? pagination.skip : skip,
        take: typeof pagination?.take === "number" ? pagination.take : take,
      },
    };
  },

  async getAnalytics(businessId: number): Promise<ReminderAnalytics> {
    const response = await apiClient.get(
      `/reminders/analytics/${businessId}`
    );
    const payload = response?.data?.data || {};

    const normalizeNumber = (value: any) =>
      typeof value === "number" && !Number.isNaN(value) ? value : 0;

    const rawByType = payload?.byType;
    const byType: Record<string, number> = {};
    if (rawByType && typeof rawByType === "object") {
      Object.entries(rawByType).forEach(([type, stats]) => {
        if (stats && typeof stats === "object" && "total" in stats) {
          byType[type] = normalizeNumber((stats as any).total);
        } else {
          byType[type] = normalizeNumber(stats);
        }
      });
    }

    const rawByStatus = payload?.byStatus;
    const byStatus: Record<string, number> = {};
    if (rawByStatus && typeof rawByStatus === "object") {
      Object.entries(rawByStatus).forEach(([status, count]) => {
        byStatus[status] = normalizeNumber(count);
      });
    }

    const rawLastSeven =
      Array.isArray(payload?.last7Days) ? payload.last7Days : payload?.lastSevenDays;
    const last7Days = Array.isArray(rawLastSeven)
      ? rawLastSeven.map((day: any) => ({
          date: typeof day?.date === "string" ? day.date : "",
          count: normalizeNumber(day?.count ?? day?.total),
          sent: normalizeNumber(day?.sent),
          delivered: normalizeNumber(day?.delivered),
        }))
      : [];

    return {
      totalReminders: normalizeNumber(payload?.totalReminders),
      sentReminders: normalizeNumber(payload?.sentReminders),
      deliveredReminders: normalizeNumber(payload?.deliveredReminders),
      readReminders: normalizeNumber(payload?.readReminders),
      failedReminders: normalizeNumber(payload?.failedReminders),
      sendRate: normalizeNumber(payload?.sendRate),
      deliveryRate: normalizeNumber(payload?.deliveryRate),
      readRate: normalizeNumber(payload?.readRate),
      byType,
      byStatus,
      last7Days,
    };
  },

  // ===== RESEND REMINDERS =====
  async resendReminder(logId: number): Promise<ReminderLog> {
    const response = await apiClient.post(
      `/reminders/logs/${logId}/resend`
    );
    return response?.data?.data;
  },

  // ===== TEST & HEALTH =====
  async sendTestReminder(
    businessId: number,
    appointmentId: number,
    type: ReminderType
  ): Promise<any> {
    const response = await apiClient.post(
      `/reminders/test/${businessId}`,
      { appointmentId, type }
    );
    return response?.data?.data;
  },

  async getHealth(): Promise<any> {
    const response = await apiClient.get("/reminders/health");
    return response?.data;
  },
};
