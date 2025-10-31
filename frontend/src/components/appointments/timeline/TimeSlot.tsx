import { ReactNode, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface TimeSlotProps {
  slotHeightPx: number;
  isOccupied: boolean;
  isWorkingHours: boolean;
  children?: ReactNode;
  onClick?: () => void;
  barberId: number;
  slotTime: string;
}

export function TimeSlot({
  slotHeightPx,
  isOccupied,
  isWorkingHours,
  children,
  onClick,
  barberId,
  slotTime,
}: TimeSlotProps) {
  const droppableId = useMemo(
    () => `timeline-slot-${barberId}-${slotTime}`,
    [barberId, slotTime]
  );

  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: {
      type: "slot",
      barberId,
      slotTime,
    },
    disabled: !isWorkingHours,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ height: slotHeightPx }}
      className={cn(
        "relative border-b border-gray-100 transition-colors duration-150",
        isOccupied
          ? "bg-white"
          : isWorkingHours
          ? "bg-gray-50 hover:bg-blue-50 cursor-pointer"
          : "bg-gray-100",
        isOver && isWorkingHours && !isOccupied && "bg-blue-100 border-blue-300"
      )}
      onClick={() => !isOccupied && isWorkingHours && onClick?.()}
    >
      {children}
    </div>
  );
}
