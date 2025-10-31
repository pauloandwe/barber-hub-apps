import { TimeSlot } from "@/hooks/useTimeSlots";

interface TimeScaleProps {
  slots: TimeSlot[];
  slotHeightPx: number;
}

/**
 * Renders the time scale on the left side of the timeline
 * Shows all available time slots
 */
export function TimeScale({ slots, slotHeightPx }: TimeScaleProps) {
  return (
    <div className="flex flex-col border-r border-gray-200 bg-white">
      {/* Empty header space to align with barber columns */}
      <div
        className="font-medium text-xs text-gray-700 px-4 py-2 text-center border-b border-gray-200"
        style={{ height: "60px" }}
      >
        Hora
      </div>

      {/* Time slots */}
      <div className="flex-1 overflow-hidden">
        {slots.map((slot, index) => (
          <div
            key={`${slot.startTime}-${index}`}
            className="border-b border-gray-100 text-xs text-gray-600 px-4 py-2 text-right"
            style={{ height: slotHeightPx }}
          >
            {slot.startTime}
          </div>
        ))}
      </div>
    </div>
  );
}
