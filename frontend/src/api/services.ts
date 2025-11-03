import { apiClient } from "./client";

export interface Service {
  id: number;
  businessId: number;
  name: string;
  description?: string;
  duration: number;
  price: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateServiceRequest {
  businessId: number;
  name: string;
  description?: string;
  duration: number;
  price: number;
  active?: boolean;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
  active?: boolean;
}

export const servicesAPI = {
  async getAll(businessId: number): Promise<Service[]> {
    const response = await apiClient.get(`/services?businessId=${businessId}`);
    const data = response?.data?.data?.data || response?.data?.data || [];
    return Array.isArray(data)
      ? data.map((item: Service) => normalizeService(item))
      : [];
  },

  async getById(id: number): Promise<Service> {
    const response = await apiClient.get(`/services/${id}`);
    return normalizeService(response?.data?.data as Service);
  },

  async create(data: CreateServiceRequest): Promise<Service> {
    const response = await apiClient.post("/services", data);
    return normalizeService(response?.data?.data as Service);
  },

  async update(id: number, data: UpdateServiceRequest): Promise<Service> {
    const response = await apiClient.put(`/services/${id}`, data);
    return normalizeService(response?.data?.data as Service);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/services/${id}`);
  },
};

function normalizeService(service: Service): Service {
  return {
    ...service,
    price: Number(service.price),
  };
}
