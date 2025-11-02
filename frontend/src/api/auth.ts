import { apiClient } from "./client";

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: "ADMIN" | "BARBERSHOP" | "CLIENT";
  businessId?: number;
  access_token: string;
}

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: "ADMIN" | "BARBERSHOP" | "CLIENT";
  businessId?: number;
  createdAt: string;
}

const extractResponseData = <T>(response: any): T => {
  const topLevel = response?.data;

  if (
    topLevel &&
    typeof topLevel === "object" &&
    !Array.isArray(topLevel) &&
    Object.prototype.hasOwnProperty.call(topLevel, "data")
  ) {
    const nested = (topLevel as any).data;

    if (
      nested &&
      typeof nested === "object" &&
      !Array.isArray(nested) &&
      Object.prototype.hasOwnProperty.call(nested, "data")
    ) {
      return (nested as any).data as T;
    }

    return nested as T;
  }

  return topLevel as T;
};

export const authAPI = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log("🔄 Iniciando registro com email:", data.email);
      const response = await apiClient.post("/auth/register", data);
      console.log("✅ Resposta do servidor:", response.data);
      const authData = extractResponseData<AuthResponse>(response);
      apiClient.setToken(authData.access_token);
      console.log("✅ Token armazenado com sucesso");
      return authData;
    } catch (error: any) {
      console.error("❌ Erro no registro:", error);
      console.error("Response:", error.response?.data);
      console.error("Message:", error.message);
      throw error;
    }
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      console.log("🔄 Iniciando login com email:", data.email);
      console.log("📍 URL da API:", import.meta.env.VITE_API_URL);
      const response = await apiClient.post("/auth/login", data);
      console.log("✅ Resposta do servidor:", response.data);
      const authData = extractResponseData<AuthResponse>(response);
      apiClient.setToken(authData.access_token);
      console.log("✅ Token armazenado com sucesso");

      if (authData.role === "BARBERSHOP" && !authData.businessId) {
        try {
          const profile = await authAPI.getProfile();
          console.log("ℹ️ Perfil carregado após login:", profile);
          return {
            ...profile,
            access_token: authData.access_token,
          };
        } catch (profileError) {
          console.error(
            "⚠️ Falha ao carregar perfil após login:",
            profileError
          );
        }
      }

      return authData;
    } catch (error: any) {
      console.error("❌ Erro no login:", error);
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
      console.error("Message:", error.message);
      throw error;
    }
  },

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get("/auth/me");
    return extractResponseData<UserProfile>(response);
  },

  async logout(): Promise<void> {
    apiClient.setToken(null);
    localStorage.removeItem("user");
  },

  isAuthenticated(): boolean {
    return !!apiClient.getToken();
  },

  getStoredUser(): UserProfile | null {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  setStoredUser(user: UserProfile): void {
    localStorage.setItem("user", JSON.stringify(user));
  },
};
