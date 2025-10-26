import { apiClient } from './client';

export interface Barber {
  id: number;
  businessId: number;
  nome: string;
  telefone?: string;
  especialidades?: string[];
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBarberRequest {
  businessId: number;
  nome: string;
  telefone?: string;
  especialidades?: string[];
  ativo?: boolean;
}

export interface UpdateBarberRequest {
  nome?: string;
  telefone?: string;
  especialidades?: string[];
  ativo?: boolean;
}

export const barbersAPI = {
  async getAll(businessId: number): Promise<Barber[]> {
    const response = await apiClient.get(
      `/barbers?businessId=${businessId}`
    );
    return response.data.data || [];
  },

  async getById(id: number): Promise<Barber> {
    const response = await apiClient.get(`/barbers/${id}`);
    return response.data.data;
  },

  async create(data: CreateBarberRequest): Promise<Barber> {
    const response = await apiClient.post('/barbers', data);
    return response.data.data;
  },

  async update(id: number, data: UpdateBarberRequest): Promise<Barber> {
    const response = await apiClient.put(`/barbers/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/barbers/${id}`);
  },
};
