import { apiClient } from "./client";

export interface Appointment {
  id: number;
  businessId: number;
  serviceId: number;
  barberId?: number;
  clientId: number | null;
  clientContactId: number | null;
  startDate: string;
  endDate: string;
  status: "pending" | "confirmed" | "cancelled" | "canceled";
  source: "web" | "whatsapp" | null;
  notes?: string;
  createdAt?: string;
  barber?: { name: string };
  client?: { id?: number; name: string };
  clientContact?: { id: number; name: string | null; phone: string };
  service?: { name: string; duration: number };
}

export interface CreateAppointmentRequest {
  businessId: number;
  serviceId: number;
  barberId: number;
  clientId?: number;
  clientPhone?: string;
  clientName?: string;
  startDate: string;
  endDate: string;
  notes?: string;
  source?: "web" | "whatsapp";
}

export interface UpdateAppointmentRequest {
  serviceId?: number;
  barberId?: number;
  clientId?: number;
  clientPhone?: string;
  clientName?: string;
  startDate?: string;
  endDate?: string;
  source?: "web" | "whatsapp";
  notes?: string;
}

export interface AppointmentTimelineCard {
  id: number;
  barberId: number;
  startDate: string;
  endDate: string;
  status: "pending" | "confirmed" | "canceled";
  notes: string | null;
  source: "web" | "whatsapp" | null;
  clientContact: {
    name: string | null;
    phone: string;
  };
  service: {
    name: string;
    duration: number;
    price: number;
  };
}

export interface BarberWorkingHour {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  closed: boolean;
}

export interface BarberTimeline {
  id: number;
  name: string;
  specialties: string[];
  appointments: AppointmentTimelineCard[];
  workingHours: BarberWorkingHour;
}

export interface AppointmentTimelineResponse {
  date: string;
  barbers: BarberTimeline[];
  slotDurationMinutes: number;
}

export const appointmentsAPI = {
  async getAll(businessId: number): Promise<Appointment[]> {
    const response = await apiClient.get(
      `/appointments/${businessId}/appointments`
    );
    return response?.data?.data?.data || response?.data?.data || [];
  },

  async getById(businessId: number, id: number): Promise<Appointment> {
    const response = await apiClient.get(
      `/appointments/${businessId}/appointments/${id}`
    );
    return response?.data?.data?.data || response?.data?.data;
  },

  async create(
    businessId: number,
    data: CreateAppointmentRequest
  ): Promise<Appointment> {
    const response = await apiClient.post(
      `/appointments/${businessId}/appointments`,
      data
    );
    return response?.data?.data;
  },

  async update(
    businessId: number,
    id: number,
    data: UpdateAppointmentRequest
  ): Promise<Appointment> {
    const response = await apiClient.put(
      `/appointments/${businessId}/appointments/${id}`,
      data
    );
    return response?.data?.data;
  },

  async partialUpdate(
    businessId: number,
    id: number,
    data: Partial<UpdateAppointmentRequest>
  ): Promise<Appointment> {
    const response = await apiClient.patch(
      `/appointments/${businessId}/appointments/${id}`,
      data
    );
    return response?.data?.data;
  },

  async delete(businessId: number, id: number): Promise<void> {
    await apiClient.delete(`/appointments/${businessId}/appointments/${id}`);
  },

  async getSuggestions(data: any): Promise<any> {
    const response = await apiClient.post("/appointments/suggest", data);
    return response?.data?.data;
  },

  async getTimeline(
    businessId: number,
    date: string,
    barberIds?: number[],
    status?: "pending" | "confirmed" | "canceled",
    serviceId?: number
  ): Promise<AppointmentTimelineResponse> {
    const params = new URLSearchParams();
    params.append("date", date);
    if (barberIds && barberIds.length > 0) {
      params.append("barberIds", barberIds.join(","));
    }
    if (status) {
      params.append("status", status);
    }
    if (serviceId) {
      params.append("serviceId", serviceId.toString());
    }

    const response = await apiClient.get(
      `/appointments/${businessId}/timeline?${params.toString()}`
    );
    console.log("\n\n\n\nresponse", response);

    return response?.data?.data?.data || response?.data?.data;
  },
};
