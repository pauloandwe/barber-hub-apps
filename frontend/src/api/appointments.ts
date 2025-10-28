import { apiClient } from "./client";

export interface Appointment {
  id: number;
  businessId: number;
  barberId?: number;
  clientId: number;
  startDate: string;
  endDate: string;
  status: "pending" | "confirmed" | "cancelled";
  source: "web" | "whatsapp";
  notes?: string;
  createdAt?: string;
  barber?: { name: string };
  client?: { name: string };
  service?: { name: string; duration: number };
}

export interface CreateAppointmentRequest {
  barberId?: number;
  clientId: number;
  startDate: string;
  endDate: string;
  status?: "pending" | "confirmed" | "cancelled";
  source?: "web" | "whatsapp";
  notes?: string;
}

export interface UpdateAppointmentRequest {
  barberId?: number;
  clientId?: number;
  startDate?: string;
  endDate?: string;
  status?: "pending" | "confirmed" | "cancelled";
  source?: "web" | "whatsapp";
  notes?: string;
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
    return response?.data?.data;
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
};
