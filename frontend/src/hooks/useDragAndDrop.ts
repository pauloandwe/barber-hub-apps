import { useState, useCallback } from "react";
import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { AppointmentTimelineCard, BarberTimeline } from "@/api/appointments";
import { appointmentsAPI } from "@/api/appointments";
import { toast } from "sonner";

interface DragDropPayload {
  appointmentId: number;
  originalBarberId: number;
  originalStartDate: string;
}

interface UseDragAndDropOptions {
  businessId: number;
  barbers: BarberTimeline[];
  onAppointmentUpdate?: (appointmentId: number) => void;
}

export function useDragAndDrop({
  businessId,
  barbers,
  onAppointmentUpdate,
}: UseDragAndDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedAppointment, setDraggedAppointment] =
    useState<DragDropPayload | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;

    if (active.data.current) {
      setIsDragging(true);
      setDraggedAppointment({
        appointmentId: active.data.current.appointmentId,
        originalBarberId: active.data.current.barberId,
        originalStartDate: active.data.current.startDate,
      });
    }
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { over } = event;
      setIsDragging(false);

      const overData = over?.data.current;

      if (!draggedAppointment || !overData) {
        setDraggedAppointment(null);
        return;
      }

      if (overData.type !== "slot") {
        setDraggedAppointment(null);
        return;
      }

      const targetBarberId = overData.barberId;
      const targetSlotTime = overData.slotTime;

      if (!targetBarberId || !targetSlotTime) {
        toast.error("Slot inválido para reagendamento");
        setDraggedAppointment(null);
        return;
      }

      const originalAppointment = findAppointment(
        barbers,
        draggedAppointment.appointmentId
      );

      if (!originalAppointment) {
        toast.error("Agendamento não encontrado");
        setDraggedAppointment(null);
        return;
      }

      try {
        const durationMinutes = originalAppointment.service.duration;
        const [targetHour, targetMinute] = targetSlotTime
          .split(":")
          .map(Number);

        const originalDate = new Date(originalAppointment.startDate);
        const newStartDate = new Date(originalDate);
        newStartDate.setUTCHours(targetHour, targetMinute, 0, 0);
        const newEndDate = new Date(newStartDate);
        newEndDate.setUTCMinutes(newEndDate.getUTCMinutes() + durationMinutes);

        await appointmentsAPI.update(
          businessId,
          draggedAppointment.appointmentId,
          {
            barberId: targetBarberId,
            startDate: newStartDate.toISOString(),
            endDate: newEndDate.toISOString(),
          }
        );

        toast.success("Agendamento reagendado com sucesso!");
        onAppointmentUpdate?.(draggedAppointment.appointmentId);
      } catch (error) {
        console.error("Erro ao reagendar:", error);
        toast.error("Erro ao reagendar agendamento. Tente novamente.");
      } finally {
        setDraggedAppointment(null);
      }
    },
    [draggedAppointment, businessId, barbers, onAppointmentUpdate]
  );

  return {
    isDragging,
    draggedAppointment,
    handleDragStart,
    handleDragEnd,
  };
}

function findAppointment(
  barbers: BarberTimeline[],
  appointmentId: number
): AppointmentTimelineCard | null {
  for (const barber of barbers) {
    const appointment = barber.appointments.find(
      (apt) => apt.id === appointmentId
    );
    if (appointment) {
      return appointment;
    }
  }
  return null;
}

export function isTimeSlotAvailable(
  barber: BarberTimeline,
  startTime: string,
  durationMinutes: number,
  excludeAppointmentId?: number
): boolean {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const slotStartMinutes = startHour * 60 + startMinute;
  const slotEndMinutes = slotStartMinutes + durationMinutes;

  for (const apt of barber.appointments) {
    if (excludeAppointmentId && apt.id === excludeAppointmentId) {
      continue;
    }

    const aptStartTime = new Date(apt.startDate);
    const aptEndTime = new Date(apt.endDate);
    const aptStartMinutes =
      aptStartTime.getHours() * 60 + aptStartTime.getMinutes();
    const aptEndMinutes = aptEndTime.getHours() * 60 + aptEndTime.getMinutes();

    if (
      (slotStartMinutes >= aptStartMinutes &&
        slotStartMinutes < aptEndMinutes) ||
      (slotEndMinutes > aptStartMinutes && slotEndMinutes <= aptEndMinutes) ||
      (slotStartMinutes <= aptStartMinutes && slotEndMinutes >= aptEndMinutes)
    ) {
      return false;
    }
  }

  if (barber.workingHours.closed || !barber.workingHours.openTime) {
    return false;
  }

  const [openHour, openMin] = barber.workingHours.openTime
    .split(":")
    .map(Number);
  const [closeHour, closeMin] = barber.workingHours
    .closeTime!.split(":")
    .map(Number);

  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  if (slotStartMinutes < openMinutes || slotEndMinutes > closeMinutes) {
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

    if (
      (slotStartMinutes >= breakStartMinutes &&
        slotStartMinutes < breakEndMinutes) ||
      (slotEndMinutes > breakStartMinutes && slotEndMinutes <= breakEndMinutes)
    ) {
      return false;
    }
  }

  return true;
}
