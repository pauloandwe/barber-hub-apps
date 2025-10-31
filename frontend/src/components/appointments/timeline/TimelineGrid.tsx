import { DndContext, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { BarberTimeline, AppointmentTimelineCard } from "@/api/appointments";
import { TimeSlot, useAllTimeSlots } from "@/hooks/useTimeSlots";
import { TimeScale } from "./TimeScale";
import { BarberColumn } from "./BarberColumn";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TimelineGridProps {
  barbers: BarberTimeline[];
  slotDurationMinutes?: number;
  slotHeightPx?: number;
  onSlotClick?: (payload: { barber: BarberTimeline; slot: TimeSlot }) => void;
  onAppointmentEdit?: (appointment: AppointmentTimelineCard) => void;
  onAppointmentDelete?: (appointment: AppointmentTimelineCard) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  isDragging?: boolean;
  isLoading?: boolean;
}

const DEFAULT_SLOT_HEIGHT = 48;

export function TimelineGrid({
  barbers,
  slotDurationMinutes = 30,
  slotHeightPx = DEFAULT_SLOT_HEIGHT,
  onSlotClick,
  onAppointmentEdit,
  onAppointmentDelete,
  onDragStart,
  onDragEnd,
  isDragging = false,
  isLoading = false,
}: TimelineGridProps) {
  const timeSlots = useAllTimeSlots(
    barbers.map((b) => b.workingHours),
    slotDurationMinutes
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando agenda...</p>
        </div>
      </div>
    );
  }

  if (barbers.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600">
          Nenhum barbeiro disponível para esta data
        </p>
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600">
          Nenhum horário de funcionamento configurado
        </p>
      </div>
    );
  }

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div
        className={cn(
          "relative rounded-lg border border-gray-200 bg-white overflow-hidden",
          isDragging && "opacity-75"
        )}
      >
        <ScrollArea className="h-[600px] w-full">
          <div className="flex">
            <TimeScale slots={timeSlots} slotHeightPx={slotHeightPx} />

            <div className="flex flex-1">
              {barbers.map((barber) => (
                <BarberColumn
                  key={barber.id}
                  barber={barber}
                  timeSlots={timeSlots}
                  slotDurationMinutes={slotDurationMinutes}
                  slotHeightPx={slotHeightPx}
                  onSlotClick={onSlotClick}
                  onAppointmentEdit={onAppointmentEdit}
                  onAppointmentDelete={onAppointmentDelete}
                />
              ))}
            </div>
          </div>

          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </DndContext>
  );
}
