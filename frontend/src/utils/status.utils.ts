import {
  APPOINTMENT_STATUS,
  AppointmentStatus,
} from "@/constants/business-hours";

interface StatusColorConfig {
  bg: string;
  text: string;
  border: string;
}

const STATUS_COLORS: Record<string, StatusColorConfig> = {
  [APPOINTMENT_STATUS.PENDING]: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  [APPOINTMENT_STATUS.CONFIRMED]: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  [APPOINTMENT_STATUS.COMPLETED]: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  [APPOINTMENT_STATUS.CANCELLED]: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
};

const GENERIC_STATUS_COLORS: Record<"active" | "inactive", StatusColorConfig> =
  {
    active: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
    },
    inactive: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    },
  };

export function getStatusColors(status: AppointmentStatus): StatusColorConfig {
  return STATUS_COLORS[status] || STATUS_COLORS[APPOINTMENT_STATUS.PENDING];
}

export function getActiveStatusColors(isActive: boolean): StatusColorConfig {
  return isActive
    ? GENERIC_STATUS_COLORS.active
    : GENERIC_STATUS_COLORS.inactive;
}

export function getAllStatusColors(): Record<string, StatusColorConfig> {
  return STATUS_COLORS;
}

export function formatStatus(status: AppointmentStatus): string {
  const statusLabels: Record<AppointmentStatus, string> = {
    [APPOINTMENT_STATUS.PENDING]: "Pending",
    [APPOINTMENT_STATUS.CONFIRMED]: "Confirmed",
    [APPOINTMENT_STATUS.COMPLETED]: "Completed",
    [APPOINTMENT_STATUS.CANCELLED]: "Cancelled",
  };

  return statusLabels[status] || "Unknown";
}

export function formatActiveStatus(isActive: boolean): string {
  return isActive ? "Active" : "Inactive";
}
