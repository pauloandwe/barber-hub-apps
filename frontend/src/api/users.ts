import { apiClient } from "./client";

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: "ADMIN" | "BARBERSHOP" | "CLIENT";
  businessId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  phone?: string;
  role?: "ADMIN" | "BARBERSHOP" | "CLIENT";
  businessId?: number;
}

export const usersAPI = {
  async getAll(): Promise<UserProfile[]> {
    const response = await apiClient.get("/users");
    return response?.data?.data?.data || response?.data?.data || [];
  },

  async getById(id: number): Promise<UserProfile> {
    const response = await apiClient.get(`/users/${id}`);
    return response?.data?.data;
  },

  async getMe(): Promise<UserProfile> {
    const response = await apiClient.get("/users/me");
    return response?.data?.data;
  },

  async update(id: number, data: UpdateUserRequest): Promise<UserProfile> {
    const response = await apiClient.put(`/users/${id}`, data);
    return response?.data?.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};
