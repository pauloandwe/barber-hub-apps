import { BarberTimeline, AppointmentTimelineCard } from "@/api/appointments";
import { TimeSlot } from "@/hooks/useTimeSlots";
import { TimeSlot as TimeSlotComponent } from "./TimeSlot";
import { AppointmentCard } from "./AppointmentCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface BarberColumnProps {
  barber: BarberTimeline;
  timeSlots: TimeSlot[];
  slotDurationMinutes: number;
  slotHeightPx: number;
  onSlotClick?: (payload: { barber: BarberTimeline; slot: TimeSlot }) => void;
  onAppointmentEdit?: (appointment: AppointmentTimelineCard) => void;
  onAppointmentDelete?: (appointment: AppointmentTimelineCard) => void;
}

export function BarberColumn({
  barber,
  timeSlots,
  slotDurationMinutes,
  slotHeightPx,
  onSlotClick,
  onAppointmentEdit,
  onAppointmentDelete,
}: BarberColumnProps) {
  const effectiveSlotDuration = Math.max(slotDurationMinutes, 1);

  const isSlotAvailable = (slotTime: string): boolean => {
    if (barber.workingHours.closed || !barber.workingHours.openTime) {
      return false;
    }

    const [slotHour, slotMin] = slotTime.split(":").map(Number);
    const slotMinutes = slotHour * 60 + slotMin;

    const [openHour, openMin] = barber.workingHours.openTime
      .split(":")
      .map(Number);
    const [closeHour, closeMin] = (barber.workingHours.closeTime || "")
      .split(":")
      .map(Number);

    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    if (slotMinutes < openMinutes || slotMinutes >= closeMinutes) {
      return false;
    }

    if (barber.workingHours.breakStart && barber.workingHours.breakEnd) {
      const [breakStartHour, breakStartMin] = barber.workingHours.breakStart
        .split(":")
        .map(Number);
      const [breakEndHour, breakEndMin] = barber.workingHours.breakEnd
        .split(":")
        .map(Number);

      const breakStartMinutes = breakStartHour * 60 + breakStartMin;
      const breakEndMinutes = breakEndHour * 60 + breakEndMin;

      if (slotMinutes >= breakStartMinutes && slotMinutes < breakEndMinutes) {
        return false;
      }
    }

    return true;
  };

  const getAppointmentsInSlot = (
    slotTime: string
  ): AppointmentTimelineCard[] => {
    const [slotHour, slotMin] = slotTime.split(":").map(Number);
    const slotStartMinutes = slotHour * 60 + slotMin;
    const slotEndMinutes = slotStartMinutes + effectiveSlotDuration;

    return (barber.appointments ?? []).filter((apt) => {
      const aptStart = new Date(apt.startDate);
      const aptEnd = new Date(apt.endDate);

      const aptStartMinutes =
        aptStart.getUTCHours() * 60 + aptStart.getUTCMinutes();
      const aptEndMinutes = aptEnd.getUTCHours() * 60 + aptEnd.getUTCMinutes();

      return (
        aptStartMinutes >= slotStartMinutes && aptStartMinutes < slotEndMinutes
      );
    });
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col flex-1 min-w-[200px] border-l border-gray-200">
      <div className="flex items-center justify-center gap-2 h-[60px] border-b border-gray-200 bg-white px-3 py-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {getInitials(barber.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{barber.name}</p>
          {barber.specialties.length > 0 && (
            <p className="text-xs text-gray-500 truncate">
              {barber.specialties.join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {timeSlots.map((slot, index) => {
          const appointmentsInSlot = getAppointmentsInSlot(slot.startTime);
          const isWorking = isSlotAvailable(slot.startTime);
          const isOccupied = appointmentsInSlot.length > 0;

          return (
            <TimeSlotComponent
              key={`${barber.id}-${slot.startTime}-${index}`}
              slotHeightPx={slotHeightPx}
              isOccupied={isOccupied}
              isWorkingHours={isWorking}
              barberId={barber.id}
              slotTime={slot.startTime}
              onClick={() =>
                onSlotClick?.({
                  barber,
                  slot,
                })
              }
            >
              {appointmentsInSlot.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  slotDurationMinutes={effectiveSlotDuration}
                  slotHeightPx={slotHeightPx}
                  onEdit={onAppointmentEdit}
                  onDelete={onAppointmentDelete}
                />
              ))}
            </TimeSlotComponent>
          );
        })}
      </div>
    </div>
  );
}
