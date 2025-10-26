import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage
    this.token = localStorage.getItem('access_token');

    // Add JWT interceptor
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Handle 401 responses
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          this.setToken(null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  get(url: string, config = {}) {
    return this.client.get(url, config);
  }

  post(url: string, data = {}, config = {}) {
    return this.client.post(url, data, config);
  }

  put(url: string, data = {}, config = {}) {
    return this.client.put(url, data, config);
  }

  patch(url: string, data = {}, config = {}) {
    return this.client.patch(url, data, config);
  }

  delete(url: string, config = {}) {
    return this.client.delete(url, config);
  }
}

export const apiClient = new ApiClient();
