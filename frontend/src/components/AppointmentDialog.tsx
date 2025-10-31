import { useState, useEffect, useMemo } from "react";
import { authAPI } from "@/api/auth";
import { appointmentsAPI, Appointment } from "@/api/appointments";
import { businessAPI } from "@/api/business";
import {
  barberWorkingHoursAPI,
  BarberWorkingHour,
} from "@/api/barberWorkingHours";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { addMinutes, format } from "date-fns";
import { Loader2 } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { DialogProps } from "@/types/shared.types";
import { formatUtcTime } from "@/utils/date.utils";
import { ServiceSelector, Service } from "./appointments/ServiceSelector";
import { BarberSelector } from "./appointments/BarberSelector";
import { DateTimePicker } from "./appointments/DateTimePicker";
import { AppointmentSummary } from "./appointments/AppointmentSummary";

interface AppointmentDialogProps extends DialogProps {
  barbershopId: string;
  onSuccess: () => void;
  appointment?: Appointment | null;
}

const DAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

type BarberScheduleItem = {
  label: string;
  text: string;
  dayOfWeek: number;
};

export function AppointmentDialog({
  open,
  onOpenChange,
  barbershopId,
  onSuccess,
  appointment,
}: AppointmentDialogProps) {
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedBarber, setSelectedBarber] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const [services, setServices] = useState<Map<string, Service>>(new Map());
  const [businessPhone, setBusinessPhone] = useState<string | null>(null);
  const [barberWorkingHours, setBarberWorkingHours] = useState<
    BarberWorkingHour[]
  >([]);
  const [isLoadingBarberHours, setIsLoadingBarberHours] = useState(false);
  const isEditMode = Boolean(appointment);
  const originalStartDate = useMemo(() => {
    if (!appointment) {
      return undefined;
    }
    const parsed = new Date(appointment.startDate);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }, [appointment]);
  const originalDateKey = originalStartDate
    ? format(originalStartDate, "yyyy-MM-dd")
    : undefined;
  const originalTime = originalStartDate
    ? formatUtcTime(originalStartDate)
    : undefined;
  const originalBarberId = appointment?.barberId ?? undefined;

  useEffect(() => {
    if (open && isEditMode && appointment) {
      const start = originalStartDate ? new Date(originalStartDate) : null;
      const serviceId = appointment.serviceId
        ? String(appointment.serviceId)
        : "";
      const barberId = appointment.barberId ? String(appointment.barberId) : "";
      const appointmentTime = originalTime ?? "";

      setSelectedService(serviceId);
      setSelectedBarber(barberId);
      setSelectedDate(start ?? undefined);
      setSelectedTime(appointmentTime);
      setNotes(appointment.notes ?? "");
      if (appointmentTime) {
        setAvailableTimes((slots) =>
          slots.includes(appointmentTime) ? slots : [appointmentTime, ...slots]
        );
      }
    }
  }, [open, isEditMode, appointment, originalStartDate, originalTime]);

  useEffect(() => {
    console.log("selectedBarber changed:", selectedBarber);
  }, [selectedBarber]);

  useEffect(() => {
    const fetchAvailableTimes = async () => {
      if (
        !selectedDate ||
        !selectedBarber ||
        !selectedService ||
        !businessPhone ||
        !services.has(selectedService)
      ) {
        setAvailableTimes([]);
        return;
      }

      setIsLoadingTimes(true);
      try {
        const serviceId = parseInt(selectedService, 10);
        const barberId = parseInt(selectedBarber, 10);
        if (Number.isNaN(barberId)) {
          setAvailableTimes([]);
          return;
        }
        const dateParam = format(selectedDate, "yyyy-MM-dd");

        const availability = await businessAPI.getBarberFreeSlotsByPhone(
          businessPhone,
          barberId,
          {
            date: dateParam,
            serviceId,
          }
        );

        console.log("availability", availability);

        const slotStarts = (availability?.barber?.slots ?? [])
          .map((slot) => slot?.start)
          .filter((start): start is string => typeof start === "string");

        const toMinutes = (time: string) => {
          const [hours = "0", minutes = "0"] = time.split(":");
          return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
        };

        let orderedSlots = Array.from(new Set(slotStarts)).sort(
          (a, b) => toMinutes(a) - toMinutes(b)
        );

        if (
          isEditMode &&
          originalTime &&
          originalDateKey &&
          dateParam === originalDateKey &&
          originalBarberId !== undefined &&
          originalBarberId === barberId &&
          !orderedSlots.includes(originalTime)
        ) {
          orderedSlots = [...orderedSlots, originalTime].sort(
            (a, b) => toMinutes(a) - toMinutes(b)
          );
        }

        setAvailableTimes(orderedSlots);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching available times:", error);
        }
        toast.error("Erro ao carregar horários disponíveis");
      } finally {
        setIsLoadingTimes(false);
      }
    };

    console.log("Fetching available times with:", {
      selectedBarber,
      selectedDate,
      selectedService,
      businessPhone,
    });
    if (selectedBarber && selectedDate && selectedService && businessPhone) {
      fetchAvailableTimes();
    }
  }, [
    selectedBarber,
    selectedDate,
    selectedService,
    services,
    businessPhone,
    isEditMode,
    originalTime,
    originalDateKey,
    originalBarberId,
  ]);

  useEffect(() => {
    if (!open) {
      setBusinessPhone(null);
      return;
    }

    const loadBusiness = async () => {
      try {
        const barbershopIdNum = parseInt(barbershopId, 10);
        const response = await businessAPI.getById(barbershopIdNum);
        const business = response?.data;
        setBusinessPhone(business.phone || null);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error loading business info:", error);
        }
        toast.error("Erro ao carregar informações da barbearia");
      }
    };

    loadBusiness();
  }, [open, barbershopId]);

  useEffect(() => {
    if (!selectedBarber) {
      setBarberWorkingHours([]);
      return;
    }

    const barberId = parseInt(selectedBarber, 10);
    if (Number.isNaN(barberId)) {
      setBarberWorkingHours([]);
      return;
    }

    const loadWorkingHours = async () => {
      setIsLoadingBarberHours(true);
      try {
        const data = await barberWorkingHoursAPI.getAll(barberId);
        setBarberWorkingHours(Array.isArray(data) ? data : []);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error loading barber working hours:", error);
        }
        toast.error("Erro ao carregar horário do barbeiro");
        setBarberWorkingHours([]);
      } finally {
        setIsLoadingBarberHours(false);
      }
    };

    loadWorkingHours();
  }, [selectedBarber]);

  useEffect(() => {
    if (!selectedTime) {
      return;
    }

    if (
      isEditMode &&
      originalTime &&
      selectedTime === originalTime &&
      originalDateKey &&
      selectedDate &&
      format(selectedDate, "yyyy-MM-dd") === originalDateKey
    ) {
      return;
    }

    if (!availableTimes.includes(selectedTime)) {
      setSelectedTime("");
    }
  }, [
    availableTimes,
    selectedTime,
    isEditMode,
    originalTime,
    originalDateKey,
    selectedDate,
  ]);

  const handleSubmit = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    setIsLoading(true);
    try {
      const user = authAPI.getStoredUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const service = services.get(selectedService);
      if (!service) {
        toast.error("Não foi possível carregar as informações do serviço");
        return;
      }

      const serviceIdNum = parseInt(selectedService, 10);
      const barberIdNum = parseInt(selectedBarber, 10);
      if (Number.isNaN(serviceIdNum) || Number.isNaN(barberIdNum)) {
        toast.error("Serviço ou barbeiro inválido selecionado");
        return;
      }

      // Formatação de horário:
      // selectedTime vem como "HH:mm" (ex: "14:30")
      // Extraímos horas e minutos e construímos um Date object em UTC
      const [hours, minutes] = selectedTime.split(":").map(Number);

      // Cria data em UTC, não em horário local
      const utcDate = new Date(
        Date.UTC(
          selectedDate.getUTCFullYear(),
          selectedDate.getUTCMonth(),
          selectedDate.getUTCDate(),
          hours,
          minutes,
          0,
          0
        )
      );
      const startDateTime = utcDate;

      // Calcula endDate baseado na duração do serviço selecionado
      const endDateTime = addMinutes(startDateTime, service.durationMin);

      const barbershopIdNum = parseInt(barbershopId, 10);

      // Payload enviado à API:
      // - startDate e endDate em ISO string format (ex: "2024-11-20T14:30:00.000Z")
      // - serviceId, barberId como números
      // - source como 'web' (diferente de 'whatsapp')
      const basePayload = {
        serviceId: serviceIdNum,
        barberId: barberIdNum,
        startDate: startDateTime.toISOString(), // "2024-11-20T14:30:00.000Z"
        endDate: endDateTime.toISOString(), // "2024-11-20T14:50:00.000Z" (ou com duração do serviço)
        notes: notes || undefined,
      };

      if (isEditMode && appointment) {
        await appointmentsAPI.update(barbershopIdNum, appointment.id, {
          ...basePayload,
          clientId: appointment.clientId ?? user.id,
          source: appointment.source ?? "web",
        });
        toast.success("Agendamento atualizado com sucesso!");
      } else {
        await appointmentsAPI.create(barbershopIdNum, {
          businessId: barbershopIdNum,
          ...basePayload,
          clientId: user.id,
          source: "web",
        });
        toast.success("Agendamento criado com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          isEditMode
            ? "Error updating appointment:"
            : "Error creating appointment:",
          error
        );
      }
      toast.error(
        isEditMode
          ? "Erro ao atualizar agendamento"
          : "Erro ao criar agendamento"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedService("");
    setSelectedBarber("");
    setSelectedDate(undefined);
    setSelectedTime("");
    setNotes("");
    setAvailableTimes([]);
    setBarberWorkingHours([]);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const selectedServiceData = services.get(selectedService);
  const selectedDayIndex = selectedDate?.getDay();

  const barberScheduleSummary = useMemo<BarberScheduleItem[]>(() => {
    if (!barberWorkingHours.length) {
      return [];
    }

    return DAY_LABELS.map((label, index) => {
      const record = barberWorkingHours.find(
        (item) => item.dayOfWeek === index
      );

      if (!record) {
        return { label, text: "Não configurado", dayOfWeek: index };
      }

      if (record.closed) {
        return { label, text: "Fechado", dayOfWeek: index };
      }

      const range = `${record.openTime ?? "--:--"} - ${
        record.closeTime ?? "--:--"
      }`;
      if (record.breakStart && record.breakEnd) {
        return {
          label,
          text: `${range} (pausa ${record.breakStart} - ${record.breakEnd})`,
          dayOfWeek: index,
        };
      }

      return { label, text: range, dayOfWeek: index };
    });
  }, [barberWorkingHours]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Agendamento" : "Novo Agendamento"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Revise e atualize os detalhes do seu agendamento"
              : "Preencha os dados para agendar seu compromisso"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <ServiceSelector
            barbershopId={barbershopId}
            value={selectedService}
            onChange={(serviceId) => {
              setSelectedService(serviceId);
              setSelectedTime("");
            }}
            disabled={isLoading}
            onLoaded={(items) => {
              setServices(new Map(items.map((item) => [item.id, item])));
            }}
          />

          <BarberSelector
            barbershopId={barbershopId}
            value={selectedBarber}
            onChange={setSelectedBarber}
            disabled={isLoading}
          />

          {selectedBarber && (
            <div className="space-y-2">
              <Label>Horário do barbeiro</Label>
              {isLoadingBarberHours ? (
                <LoadingSpinner size="small" />
              ) : !barberScheduleSummary.length ? (
                <p className="text-sm text-muted-foreground">
                  Este barbeiro não tem horários de trabalho configurados.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {barberScheduleSummary.map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-md border px-3 py-2 text-sm ${
                        selectedDayIndex === item.dayOfWeek
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background"
                      }`}
                    >
                      <div className="font-medium">{item.label}</div>
                      <div className="text-muted-foreground">{item.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DateTimePicker
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedTime={selectedTime}
            onTimeChange={setSelectedTime}
            availableTimes={availableTimes}
            isLoadingTimes={isLoadingTimes}
          />

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Alguma observação adicional?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <AppointmentSummary service={selectedServiceData} />
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              !selectedService ||
              !selectedBarber ||
              !selectedDate ||
              !selectedTime
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Salvar mudanças" : "Confirmar Agendamento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AppointmentDialog;
