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

export interface ProfessionalAvailabilitySlot {
  start: string;
  end: string;
}

export interface ProfessionalAvailability {
  id: number;
  name: string;
  specialties?: string[] | null;
  slots: ProfessionalAvailabilitySlot[];
}

export interface AvailabilityResponse {
  date: string;
  slotDurationMinutes: number;
  professionals: ProfessionalAvailability[];
}

export interface SingleProfessionalAvailabilityResponse {
  date: string;
  slotDurationMinutes: number;
  professional: ProfessionalAvailability;
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

  async getProfessionalFreeSlotsByPhone(
    phone: string,
    professionalId: number,
    params: { date?: string; serviceId?: number }
  ): Promise<SingleProfessionalAvailabilityResponse> {
    const response = await apiClient.get(
      `/business/phone/${phone}/professionals/${professionalId}/free-slots`,
      {
        params,
      }
    );
    return extractResponseData(response);
  },
};
