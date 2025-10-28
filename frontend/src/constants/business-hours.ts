export const BUSINESS_HOURS = {
  OPENING_HOUR: 8,
  CLOSING_HOUR: 18,
  TIME_SLOT_INTERVAL_MINUTES: 30,
  MINIMUM_SERVICE_DURATION_MINUTES: 5,
  MAXIMUM_APPOINTMENTS_PER_DAY: 100,
} as const;

export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type AppointmentStatus =
  (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];
