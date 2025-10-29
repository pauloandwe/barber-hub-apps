import { apiClient } from "./client";

export interface Business {
  id: number;
  name: string;
  phone: string;
  type?: string;
  token?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBusinessRequest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  type?: string;
  token?: string;
}

export interface UpdateBusinessRequest {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  type?: string;
  token?: string;
}

export interface BarberAvailabilitySlot {
  start: string;
  end: string;
}

export interface BarberAvailability {
  id: number;
  name: string;
  specialties?: string[] | null;
  slots: BarberAvailabilitySlot[];
}

export interface AvailabilityResponse {
  date: string;
  slotDurationMinutes: number;
  barbers: BarberAvailability[];
}

export interface SingleBarberAvailabilityResponse {
  date: string;
  slotDurationMinutes: number;
  barber: BarberAvailability;
}

const extractResponseData = (response: any) => {
  const topLevel = response?.data;

  if (topLevel?.data?.data !== undefined) {
    return topLevel.data.data;
  }

  if (topLevel?.data !== undefined) {
    return topLevel.data;
  }

  return topLevel;
};

export const businessAPI = {
  async getAll(): Promise<Business[]> {
    const response = await apiClient.get("/business");
    console.log("response", response);

    return response?.data?.data?.data || response?.data?.data || [];
  },

  async getById(id: number): Promise<Business> {
    const response = await apiClient.get(`/business/${id}`);
    return response?.data?.data;
  },

  async create(data: CreateBusinessRequest): Promise<Business> {
    const response = await apiClient.post("/business", data);
    return response?.data?.data;
  },

  async update(id: number, data: UpdateBusinessRequest): Promise<Business> {
    const response = await apiClient.put(`/business/${id}`, data);
    return response?.data?.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/business/${id}`);
  },

  async getFreeSlotsByPhone(
    phone: string,
    params: { date?: string; serviceId?: number }
  ): Promise<AvailabilityResponse> {
    const response = await apiClient.get(
      `/business/phone/${phone}/free-slots`,
      {
        params,
      }
    );
    return extractResponseData(response);
  },

  async getBarberFreeSlotsByPhone(
    phone: string,
    barberId: number,
    params: { date?: string; serviceId?: number }
  ): Promise<SingleBarberAvailabilityResponse> {
    const response = await apiClient.get(
      `/business/phone/${phone}/barbers/${barberId}/free-slots`,
      {
        params,
      }
    );
    return extractResponseData(response);
  },
};
