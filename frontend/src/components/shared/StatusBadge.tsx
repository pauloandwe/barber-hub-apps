import {
  formatStatus,
  formatActiveStatus,
  getStatusColors,
  getActiveStatusColors,
} from "@/utils/status.utils";
import {
  APPOINTMENT_STATUS,
  AppointmentStatus,
} from "@/constants/business-hours";
import { WithClassName } from "@/types/shared.types";

interface StatusBadgeProps extends WithClassName {
  status?: AppointmentStatus | "active" | "inactive";
  isActive?: boolean;
  type?: "appointment" | "service";
}

export function StatusBadge({
  status,
  isActive,
  type = "appointment",
  className,
}: StatusBadgeProps) {
  let colors;
  let text;

  if (
    type === "appointment" &&
    status &&
    Object.values(APPOINTMENT_STATUS).includes(status as AppointmentStatus)
  ) {
    colors = getStatusColors(status as AppointmentStatus);
    text = formatStatus(status as AppointmentStatus);
  } else if (isActive !== undefined) {
    colors = getActiveStatusColors(isActive);
    text = formatActiveStatus(isActive);
  } else {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colors.bg} ${colors.text} ${colors.border} ${className}`}
    >
      {text}
    </span>
  );
}
