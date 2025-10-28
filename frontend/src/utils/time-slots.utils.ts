import { BUSINESS_HOURS } from "@/constants/business-hours";

interface TimeSlot {
  time: string;
  label: string;
  isAvailable: boolean;
}

export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const { OPENING_HOUR, CLOSING_HOUR, TIME_SLOT_INTERVAL_MINUTES } =
    BUSINESS_HOURS;

  for (let hour = OPENING_HOUR; hour < CLOSING_HOUR; hour++) {
    for (let minutes = 0; minutes < 60; minutes += TIME_SLOT_INTERVAL_MINUTES) {
      const time = `${String(hour).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}`;
      slots.push({
        time,
        label: time,
        isAvailable: true,
      });
    }
  }

  return slots;
}

export function getAvailableTimeSlots(
  allSlots: TimeSlot[],
  bookedTimes: string[],
  serviceDurationMinutes: number
): TimeSlot[] {
  return allSlots.map((slot) => {
    const [hours, minutes] = slot.time.split(":").map(Number);
    const slotStart = hours * 60 + minutes;
    const slotEnd = slotStart + serviceDurationMinutes;
    const isConflict = bookedTimes.some((bookedTime) => {
      const [bookedHours, bookedMinutes] = bookedTime.split(":").map(Number);
      const bookedStart = bookedHours * 60 + bookedMinutes;
      const bookedEnd = bookedStart + 30;

      return !(slotEnd <= bookedStart || slotStart >= bookedEnd);
    });

    return {
      ...slot,
      isAvailable: !isConflict,
    };
  });
}

export function getTimeSlotsForDate(
  date: Date,
  bookedAppointments: Array<{ time: string; duration: number }> = []
): TimeSlot[] {
  const allSlots = generateTimeSlots();
  const bookedTimes = bookedAppointments.map((apt) => apt.time);

  const avgDuration =
    bookedAppointments.length > 0
      ? Math.max(...bookedAppointments.map((apt) => apt.duration))
      : 30;

  return getAvailableTimeSlots(allSlots, bookedTimes, avgDuration);
}

export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function calculateEndTime(
  startTime: string,
  durationMinutes: number
): string {
  const startMinutes = timeStringToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  return minutesToTimeString(endMinutes);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}
