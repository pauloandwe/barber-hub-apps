import { useMemo } from "react";
import { ProfessionalWorkingHour } from "@/api/appointments";

export interface TimeSlot {
  startTime: string;
  endTime: string;
  startHour: number;
  startMinute: number;
}

interface UseTimeSlotsOptions {
  workingHours: ProfessionalWorkingHour;
  slotDurationMinutes?: number;
}

function buildTimeSlots({
  workingHours,
  slotDurationMinutes,
}: Required<UseTimeSlotsOptions>): TimeSlot[] {
  if (
    workingHours.closed ||
    !workingHours.openTime ||
    !workingHours.closeTime
  ) {
    return [];
  }

  const slots: TimeSlot[] = [];

  const [openHour, openMin] = workingHours.openTime.split(":").map(Number);
  const [closeHour, closeMin] = workingHours.closeTime.split(":").map(Number);

  let breakStartMinutes: number | null = null;
  let breakEndMinutes: number | null = null;

  if (workingHours.breakStart && workingHours.breakEnd) {
    const [breakStartHour, breakStartMin] = workingHours.breakStart
      .split(":")
      .map(Number);
    const [breakEndHour, breakEndMin] = workingHours.breakEnd
      .split(":")
      .map(Number);

    breakStartMinutes = breakStartHour * 60 + breakStartMin;
    breakEndMinutes = breakEndHour * 60 + breakEndMin;
  }

  let currentMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  while (currentMinutes < closeMinutes) {
    if (
      breakStartMinutes !== null &&
      breakEndMinutes !== null &&
      currentMinutes >= breakStartMinutes &&
      currentMinutes < breakEndMinutes
    ) {
      currentMinutes = breakEndMinutes;
      continue;
    }

    const slotEndMinutes = currentMinutes + slotDurationMinutes;

    if (slotEndMinutes <= closeMinutes) {
      const startHour = Math.floor(currentMinutes / 60);
      const startMinute = currentMinutes % 60;
      const endHour = Math.floor(slotEndMinutes / 60);
      const endMinute = slotEndMinutes % 60;

      slots.push({
        startTime: `${String(startHour).padStart(2, "0")}:${String(
          startMinute
        ).padStart(2, "0")}`,
        endTime: `${String(endHour).padStart(2, "0")}:${String(
          endMinute
        ).padStart(2, "0")}`,
        startHour,
        startMinute,
      });
    }

    currentMinutes += slotDurationMinutes;
  }

  return slots;
}

export function useTimeSlots({
  workingHours,
  slotDurationMinutes = 30,
}: UseTimeSlotsOptions): TimeSlot[] {
  return useMemo(
    () =>
      buildTimeSlots({
        workingHours,
        slotDurationMinutes,
      }),
    [workingHours, slotDurationMinutes]
  );
}

export function useAllTimeSlots(
  professionalWorkingHours: ProfessionalWorkingHour[],
  slotDurationMinutes: number = 30
): TimeSlot[] {
  return useMemo(() => {
    const allSlots = new Map<string, TimeSlot>();

    professionalWorkingHours.forEach((hours) => {
      const slots = buildTimeSlots({
        workingHours: hours,
        slotDurationMinutes,
      });
      slots.forEach((slot) => {
        allSlots.set(slot.startTime, slot);
      });
    });

    return Array.from(allSlots.values()).sort((a, b) => {
      if (a.startHour !== b.startHour) {
        return a.startHour - b.startHour;
      }
      return a.startMinute - b.startMinute;
    });
  }, [professionalWorkingHours, slotDurationMinutes]);
}
