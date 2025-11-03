import { apiClient } from "./client";

export interface Professional {
  id: number;
  businessId: number;
  name: string;
  phone?: string;
  specialties?: string[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProfessionalRequest {
  businessId: number;
  name: string;
  phone?: string;
  specialties?: string[];
  active?: boolean;
}

export interface UpdateProfessionalRequest {
  name?: string;
  phone?: string;
  specialties?: string[];
  active?: boolean;
}

export const professionalsAPI = {
  async getAll(businessId: number): Promise<Professional[]> {
    const response = await apiClient.get(`/professionals?businessId=${businessId}`);
    return response?.data?.data?.data || response?.data?.data || [];
  },

  async getById(id: number): Promise<Professional> {
    const response = await apiClient.get(`/professionals/${id}`);
    return response?.data?.data;
  },

  async create(data: CreateProfessionalRequest): Promise<Professional> {
    const response = await apiClient.post("/professionals", data);
    return response?.data?.data;
  },

  async update(id: number, data: UpdateProfessionalRequest): Promise<Professional> {
    const response = await apiClient.put(`/professionals/${id}`, data);
    return response?.data?.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/professionals/${id}`);
  },
};
