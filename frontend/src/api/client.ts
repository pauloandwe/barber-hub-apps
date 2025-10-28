import axios, { AxiosInstance } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.token = localStorage.getItem("access_token");

    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;

        if (status === 401) {
          const isTokenExpired =
            error.response?.data?.message?.includes("expired") ||
            error.response?.data?.message?.includes("Invalid");

          if (isTokenExpired) {
            this.setToken(null);
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }
        }

        if (status === 403) {
          console.error("[API] Forbidden error:", error.response?.data);
        }

        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem("access_token", token);
    } else {
      localStorage.removeItem("access_token");
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
