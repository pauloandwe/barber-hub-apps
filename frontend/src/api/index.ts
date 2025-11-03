export { apiClient } from "./client";
export { authAPI } from "./auth";
export { businessAPI } from "./business";
export { usersAPI } from "./users";
export { appointmentsAPI } from "./appointments";
export { professionalsAPI } from "./professionals";

export { professionalsAPI as professionalsAPI } from "./professionals";
export { servicesAPI } from "./services";
export { remindersAPI } from "./reminders";
export {
  hairhubTools,
  showAppointmentsTool,
  getUpcomingAppointmentsTool,
  executeHairHubTool,
} from "./hairhub-tools";
export type {
  AuthResponse,
  UserProfile,
  LoginRequest,
  RegisterRequest,
} from "./auth";
export type {
  Business,
  CreateBusinessRequest,
  UpdateBusinessRequest,
} from "./business";
export type { UserProfile as UserProfileApi, UpdateUserRequest } from "./users";
export type {
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
} from "./appointments";
export type {
  Professional,
  CreateProfessionalRequest,
  UpdateProfessionalRequest,
  CreateProfessionalRequest as CreateBarberRequest,
  UpdateProfessionalRequest as UpdateBarberRequest,
} from "./professionals";
export type {
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
} from "./services";
export type {
  ReminderType,
  ReminderStatus,
  ReminderSettings,
  ReminderTemplate,
  ReminderLog,
  ReminderAnalytics,
} from "./reminders";
export type { HairHubToolContext, HairHubToolResult } from "./hairhub-tools";
