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
  type?: string;
  token?: string;
}

export interface UpdateBusinessRequest {
  name?: string;
  phone?: string;
  type?: string;
  token?: string;
}

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
};
