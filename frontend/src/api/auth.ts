import { apiClient } from './client';

export interface RegisterRequest {
  email: string;
  password: string;
  nome: string;
  telefone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: number;
  email: string;
  nome: string;
  telefone: string;
  role: 'ADMIN' | 'BARBEARIA' | 'CLIENTE';
  access_token: string;
}

export interface UserProfile {
  id: number;
  email: string;
  nome: string;
  telefone: string;
  role: 'ADMIN' | 'BARBEARIA' | 'CLIENTE';
  barbearia_id?: number;
  created_at: string;
}

export const authAPI = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', data);
    const authData = response.data.data.data;
    apiClient.setToken(authData.access_token);
    return authData;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', data);
    const authData = response.data.data.data;
    apiClient.setToken(authData.access_token);
    return authData;
  },

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get('/auth/me');
    return response.data.data.data;
  },

  async logout(): Promise<void> {
    apiClient.setToken(null);
    localStorage.removeItem('user');
  },

  isAuthenticated(): boolean {
    return !!apiClient.getToken();
  },

  getStoredUser(): UserProfile | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  setStoredUser(user: UserProfile): void {
    localStorage.setItem('user', JSON.stringify(user));
  },
};
