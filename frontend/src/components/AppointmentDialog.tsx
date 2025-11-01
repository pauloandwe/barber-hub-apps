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
import { formatTime } from "@/utils/date.utils";
import { ServiceSelector, Service } from "./appointments/ServiceSelector";
import { BarberSelector } from "./appointments/BarberSelector";
import { ClientSelector, ClientSelection } from "./appointments/ClientSelector";
import { DateTimePicker } from "./appointments/DateTimePicker";
import { AppointmentSummary } from "./appointments/AppointmentSummary";

interface AppointmentDialogProps extends DialogProps {
  barbershopId: string;
  onSuccess: () => void;
  appointment?: Appointment | null;
  initialSelection?: {
    barberId?: number;
    barberName?: string;
    date?: Date;
    time?: string;
  };
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

const normalizePhoneDigits = (phone?: string | null): string | undefined => {
  if (!phone) {
    return undefined;
  }

  const digits = phone.replace(/\D/g, "");
  return digits.length ? digits : undefined;
};

export function AppointmentDialog({
  open,
  onOpenChange,
  barbershopId,
  onSuccess,
  appointment,
  initialSelection,
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
  const [selectedClient, setSelectedClient] = useState<ClientSelection | null>(
    null
  );
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
    ? formatTime(originalStartDate)
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
      setSelectedClient({
        type: "existing",
        clientId: appointment.clientId ?? null,
        clientContactId: appointment.clientContactId ?? null,
        name:
          appointment.client?.name ?? appointment.clientContact?.name ?? null,
        phone: appointment.clientContact?.phone ?? null,
      });
    }
  }, [open, isEditMode, appointment, originalStartDate, originalTime]);

  useEffect(() => {
    if (!open || isEditMode) {
      return;
    }

    setSelectedClient(null);

    if (!initialSelection) {
      setSelectedService("");
      setSelectedBarber("");
      setSelectedDate(undefined);
      setSelectedTime("");
      setAvailableTimes([]);
      setNotes("");
      return;
    }

    setSelectedService("");
    setNotes("");
    setSelectedBarber(
      initialSelection.barberId ? String(initialSelection.barberId) : ""
    );
    setSelectedDate(
      initialSelection.date ? new Date(initialSelection.date) : undefined
    );

    if (initialSelection.time) {
      setSelectedTime(initialSelection.time);
      setAvailableTimes([initialSelection.time]);
    } else {
      setSelectedTime("");
      setAvailableTimes([]);
    }
  }, [open, isEditMode, initialSelection]);

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

    if (!availableTimes.length) {
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

    if (!selectedClient) {
      toast.error("Selecione um cliente");
      return;
    }

    const clientIdPayload =
      selectedClient.type === "existing" &&
      selectedClient.clientId !== null &&
      selectedClient.clientId !== undefined
        ? selectedClient.clientId
        : undefined;

    const clientPhonePayload = normalizePhoneDigits(selectedClient.phone);
    const clientNamePayload = selectedClient.name?.trim().length
      ? selectedClient.name.trim()
      : undefined;

    if (!clientIdPayload && !clientPhonePayload) {
      toast.error("Informe um cliente com telefone válido");
      return;
    }

    if (
      selectedClient.type === "manual" &&
      (!clientPhonePayload || clientPhonePayload.length < 8)
    ) {
      toast.error("Informe um telefone válido para o cliente");
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

      const [hours, minutes] = selectedTime.split(":").map(Number);

      // Criar um Date no timezone local e depois converter para UTC
      // O usuário seleciona "9:00" em seu timezone local (BRT)
      // Precisa ser convertido para 12:00 UTC (9:00 BRT + 3h)
      const localDate = new Date(selectedDate);
      localDate.setHours(hours, minutes, 0, 0);

      // Criar um Date em UTC ajustando pelo offset do timezone local
      const offsetMinutes = localDate.getTimezoneOffset();
      const startDateTime = new Date(Date.UTC(
        selectedDate.getUTCFullYear(),
        selectedDate.getUTCMonth(),
        selectedDate.getUTCDate(),
        hours,
        minutes,
        0,
        0
      ));
      startDateTime.setTime(startDateTime.getTime() + offsetMinutes * 60000);

      const endDateTime = addMinutes(startDateTime, service.durationMin);

      const barbershopIdNum = parseInt(barbershopId, 10);

      const basePayload = {
        serviceId: serviceIdNum,
        barberId: barberIdNum,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        notes: notes || undefined,
      };

      if (isEditMode && appointment) {
        await appointmentsAPI.update(barbershopIdNum, appointment.id, {
          ...basePayload,
          clientId: clientIdPayload,
          clientPhone: clientPhonePayload,
          clientName: clientNamePayload,
          source: appointment.source ?? "web",
        });
        toast.success("Agendamento atualizado com sucesso!");
      } else {
        await appointmentsAPI.create(barbershopIdNum, {
          businessId: barbershopIdNum,
          ...basePayload,
          clientId: clientIdPayload ?? undefined,
          clientPhone: clientPhonePayload,
          clientName: clientNamePayload,
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
    setSelectedClient(null);
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

          <ClientSelector
            barbershopId={barbershopId}
            value={selectedClient}
            onChange={setSelectedClient}
            disabled={isLoading}
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
            hasServiceSelected={Boolean(selectedService)}
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
