import { useState, useCallback, useMemo } from "react";
import {
  AppointmentTimelineCard,
  Appointment,
  ProfessionalTimeline,
  appointmentsAPI,
} from "@/api/appointments";
import { useTimelineData } from "@/hooks/useTimelineData";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { TimelineHeader } from "./TimelineHeader";
import { TimelineGrid } from "./TimelineGrid";
import { AppointmentDialog } from "../../AppointmentDialog";
import { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { TimeSlot } from "@/hooks/useTimeSlots";
import { toast } from "sonner";
import { formatUtcDateTime } from "@/utils/date.utils";

interface AppointmentTimelineViewProps {
  businessId: number;
}

export function AppointmentTimelineView({
  businessId,
}: AppointmentTimelineViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProfessionalIds, setSelectedProfessionalIds] = useState<
    number[] | undefined
  >();
  const [selectedStatus, setSelectedStatus] = useState<
    "pending" | "confirmed" | "canceled" | undefined
  >();
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    number | null
  >(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    professionalId: number;
    professionalName: string;
    slotTime: string;
  } | null>(null);

  const {
    data: timelineData,
    isLoading,
    isFetching,
    refetch,
  } = useTimelineData({
    businessId,
    date: currentDate,
    professionalIds: selectedProfessionalIds,
    status: selectedStatus,
  });

  const { isDragging, handleDragStart, handleDragEnd } = useDragAndDrop({
    businessId,
    professionals: timelineData?.professionals || [],
    onAppointmentUpdate: () => {
      refetch();
    },
  });

  const editingAppointment = useMemo(() => {
    if (!editingAppointmentId || !timelineData) return null;

    for (const professional of timelineData.professionals) {
      const apt = professional.appointments.find(
        (a) => a.id === editingAppointmentId
      );
      if (apt) {
        return {
          id: apt.id,
          businessId,
          serviceId: 0,
          professionalId: apt.professionalId,
          clientId: null,
          clientContactId: null,
          startDate: apt.startDate,
          endDate: apt.endDate,
          status: apt.status,
          notes: apt.notes,
          source: apt.source,
          clientContact: {
            id: 0,
            ...apt.clientContact,
          },
          service: apt.service,
        } as unknown as Appointment;
      }
    }
    return null;
  }, [editingAppointmentId, timelineData, businessId]);

  const handleSlotClick = useCallback(
    ({ professional, slot }: { professional: ProfessionalTimeline; slot: TimeSlot }) => {
      setEditingAppointmentId(null);
      setSelectedSlot({
        professionalId: professional.id,
        professionalName: professional.name,
        slotTime: slot.startTime,
      });
      setIsDialogOpen(true);
    },
    []
  );

  const handleAppointmentEdit = useCallback(
    (appointment: AppointmentTimelineCard) => {
      setEditingAppointmentId(appointment.id);
      setSelectedSlot(null);
      setIsDialogOpen(true);
    },
    []
  );

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setEditingAppointmentId(null);
    setSelectedSlot(null);
  }, []);

  const handleAppointmentSaved = useCallback(() => {
    handleDialogClose();
    refetch();
  }, [handleDialogClose, refetch]);

  const handleManualRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleAppointmentDelete = useCallback(
    async (appointment: AppointmentTimelineCard) => {
      const formattedDate = formatUtcDateTime(appointment.startDate, {
        includeConnector: false,
      });

      if (
        !window.confirm(
          `Tem certeza que deseja excluir o agendamento de ${formattedDate}?`
        )
      ) {
        return;
      }

      try {
        await appointmentsAPI.delete(businessId, appointment.id);
        toast.success("Agendamento excluído com sucesso!");
        refetch();
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Erro ao excluir agendamento:", error);
        }
        toast.error("Não foi possível excluir o agendamento. Tente novamente.");
      }
    },
    [businessId, refetch]
  );

  const handleDragStartWrapper = (event: DragStartEvent) => {
    handleDragStart(event);
  };

  const handleDragEndWrapper = (event: DragEndEvent) => {
    handleDragEnd(event);
  };

  return (
    <div className="space-y-6">
      <TimelineHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        professionals={timelineData?.professionals || []}
        selectedProfessionalIds={selectedProfessionalIds}
        onBarberFilterChange={setSelectedProfessionalIds}
        selectedStatus={selectedStatus}
        onStatusFilterChange={setSelectedStatus}
        isLoading={isLoading}
        onRefresh={handleManualRefresh}
        isRefreshing={isFetching && !isLoading}
      />

      <TimelineGrid
        professionals={timelineData?.professionals || []}
        slotDurationMinutes={timelineData?.slotDurationMinutes}
        slotHeightPx={48}
        onSlotClick={handleSlotClick}
        onAppointmentEdit={handleAppointmentEdit}
        onAppointmentDelete={handleAppointmentDelete}
        onDragStart={handleDragStartWrapper}
        onDragEnd={handleDragEndWrapper}
        isDragging={isDragging}
        isLoading={isLoading}
      />

      <AppointmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        businessId={businessId.toString()}
        onSuccess={handleAppointmentSaved}
        appointment={editingAppointment}
        initialSelection={
          selectedSlot
            ? {
                professionalId: selectedSlot.professionalId,
                professionalName: selectedSlot.professionalName,
                date: new Date(currentDate),
                time: selectedSlot.slotTime,
              }
            : undefined
        }
      />
    </div>
  );
}
