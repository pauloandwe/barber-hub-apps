import { UserRole } from "@/constants/roles";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  businessId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContext {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface Business {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  durationMin: number;
  priceCents: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Professional {
  id: string;
  businessId: string;
  name: string;
  bio?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  businessId: string;
  userId: string;
  professionalId: string;
  serviceId: string;
  dateTime: string;
  notes?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FormState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface WithChildren {
  children: React.ReactNode;
}

export interface WithClassName {
  className?: string;
}

export class AppError extends Error {
  constructor(public code: string, message: string, public details?: unknown) {
    super(message);
    this.name = "AppError";
  }
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}
