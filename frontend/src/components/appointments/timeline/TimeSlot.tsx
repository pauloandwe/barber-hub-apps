import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TimeSlotProps {
  /** Slot height in pixels */
  slotHeightPx: number;
  /** Is this slot occupied by an appointment */
  isOccupied: boolean;
  /** Is this slot within working hours */
  isWorkingHours: boolean;
  /** Optional appointment card to display */
  children?: ReactNode;
  /** Click handler for empty slots */
  onClick?: () => void;
  /** Drag and drop identifier */
  "data-barberId"?: number;
  "data-slotTime"?: string;
}

/**
 * Represents a single time slot in the timeline
 * Can be empty (available) or occupied by an appointment
 */
export function TimeSlot({
  slotHeightPx,
  isOccupied,
  isWorkingHours,
  children,
  onClick,
  ...droppableData
}: TimeSlotProps) {
  return (
    <div
      style={{ height: slotHeightPx }}
      className={cn(
        "relative border-b border-gray-100 transition-colors duration-150",
        isOccupied ? "bg-white" : isWorkingHours
          ? "bg-gray-50 hover:bg-blue-50 cursor-pointer"
          : "bg-gray-100"
      )}
      onClick={() => !isOccupied && isWorkingHours && onClick?.()}
      {...droppableData}
    >
      {children}
    </div>
  );
}
