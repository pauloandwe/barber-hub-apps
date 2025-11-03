import { useState, useEffect, useMemo } from "react";
import { authAPI } from "@/api/auth";
import { appointmentsAPI, Appointment } from "@/api/appointments";
import { businessAPI } from "@/api/business";
import {
  professionalWorkingHoursAPI,
  ProfessionalWorkingHour,
} from "@/api/professionalWorkingHours";
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
import { ProfessionalSelector } from "./appointments/ProfessionalSelector";
import { ClientSelector, ClientSelection } from "./appointments/ClientSelector";
import { DateTimePicker } from "./appointments/DateTimePicker";
import { AppointmentSummary } from "./appointments/AppointmentSummary";

interface AppointmentDialogProps extends DialogProps {
  businessId: string;
  onSuccess: () => void;
  appointment?: Appointment | null;
  initialSelection?: {
    professionalId?: number;
    professionalName?: string;
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

type ProfessionalScheduleItem = {
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
  businessId,
  onSuccess,
  appointment,
  initialSelection,
}: AppointmentDialogProps) {
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedProfessional, setSelectedProfessional] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const [services, setServices] = useState<Map<string, Service>>(new Map());
  const [businessPhone, setBusinessPhone] = useState<string | null>(null);
  const [professionalWorkingHours, setProfessionalWorkingHours] = useState<
    ProfessionalWorkingHour[]
  >([]);
  const [isLoadingProfessionalHours, setIsLoadingBarberHours] = useState(false);
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
  const originalProfessionalId = appointment?.professionalId ?? undefined;

  useEffect(() => {
    if (open && isEditMode && appointment) {
      const start = originalStartDate ? new Date(originalStartDate) : null;
      const serviceId = appointment.serviceId
        ? String(appointment.serviceId)
        : "";
      const professionalId = appointment.professionalId
        ? String(appointment.professionalId)
        : "";
      const appointmentTime = originalTime ?? "";

      setSelectedService(serviceId);
      setSelectedProfessional(professionalId);
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
      setSelectedProfessional("");
      setSelectedDate(undefined);
      setSelectedTime("");
      setAvailableTimes([]);
      setNotes("");
      return;
    }

    setSelectedService("");
    setNotes("");
    setSelectedProfessional(
      initialSelection.professionalId
        ? String(initialSelection.professionalId)
        : ""
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
        !selectedProfessional ||
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
        const professionalId = parseInt(selectedProfessional, 10);
        if (Number.isNaN(professionalId)) {
          setAvailableTimes([]);
          return;
        }
        const dateParam = format(selectedDate, "yyyy-MM-dd");

        const availability = await businessAPI.getProfessionalFreeSlotsByPhone(
          businessPhone,
          professionalId,
          {
            date: dateParam,
            serviceId,
          }
        );

        const slotStarts = (availability?.professional?.slots ?? [])
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
          originalProfessionalId !== undefined &&
          originalProfessionalId === professionalId &&
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

    if (
      selectedProfessional &&
      selectedDate &&
      selectedService &&
      businessPhone
    ) {
      fetchAvailableTimes();
    }
  }, [
    selectedProfessional,
    selectedDate,
    selectedService,
    services,
    businessPhone,
    isEditMode,
    originalTime,
    originalDateKey,
    originalProfessionalId,
  ]);

  useEffect(() => {
    if (!open) {
      setBusinessPhone(null);
      return;
    }

    const loadBusiness = async () => {
      try {
        const businessIdNum = parseInt(businessId, 10);
        const response = await businessAPI.getById(businessIdNum);
        const business = response?.data;
        setBusinessPhone(business.phone || null);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error loading business info:", error);
        }
        toast.error("Erro ao carregar informações da business");
      }
    };

    loadBusiness();
  }, [open, businessId]);

  useEffect(() => {
    if (!selectedProfessional) {
      setProfessionalWorkingHours([]);
      return;
    }

    const professionalId = parseInt(selectedProfessional, 10);
    if (Number.isNaN(professionalId)) {
      setProfessionalWorkingHours([]);
      return;
    }

    const loadWorkingHours = async () => {
      setIsLoadingBarberHours(true);
      try {
        const data = await professionalWorkingHoursAPI.getAll(professionalId);
        setProfessionalWorkingHours(Array.isArray(data) ? data : []);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error loading professional working hours:", error);
        }
        toast.error("Erro ao carregar horário do professional");
        setProfessionalWorkingHours([]);
      } finally {
        setIsLoadingBarberHours(false);
      }
    };

    loadWorkingHours();
  }, [selectedProfessional]);

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
    if (
      !selectedService ||
      !selectedProfessional ||
      !selectedDate ||
      !selectedTime
    ) {
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
      const professionalIdNum = parseInt(selectedProfessional, 10);
      if (Number.isNaN(serviceIdNum) || Number.isNaN(professionalIdNum)) {
        toast.error("Serviço ou professional inválido selecionado");
        return;
      }

      const [hours, minutes] = selectedTime.split(":").map(Number);

      const localDate = new Date(selectedDate);
      localDate.setHours(hours, minutes, 0, 0);

      const offsetMinutes = localDate.getTimezoneOffset();
      const startDateTime = new Date(
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
      startDateTime.setTime(startDateTime.getTime() + offsetMinutes * 60000);

      const endDateTime = addMinutes(startDateTime, service.durationMin);

      const businessIdNum = parseInt(businessId, 10);

      const basePayload = {
        serviceId: serviceIdNum,
        professionalId: professionalIdNum,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        notes: notes || undefined,
      };

      if (isEditMode && appointment) {
        await appointmentsAPI.update(businessIdNum, appointment.id, {
          ...basePayload,
          clientId: clientIdPayload,
          clientPhone: clientPhonePayload,
          clientName: clientNamePayload,
          source: appointment.source ?? "web",
        });
        toast.success("Agendamento atualizado com sucesso!");
      } else {
        await appointmentsAPI.create(businessIdNum, {
          businessId: businessIdNum,
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
    setSelectedProfessional("");
    setSelectedDate(undefined);
    setSelectedTime("");
    setNotes("");
    setAvailableTimes([]);
    setProfessionalWorkingHours([]);
    setSelectedClient(null);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const selectedServiceData = services.get(selectedService);
  const selectedDayIndex = selectedDate?.getDay();

  const professionalScheduleSummary = useMemo<
    ProfessionalScheduleItem[]
  >(() => {
    if (!professionalWorkingHours.length) {
      return [];
    }

    return DAY_LABELS.map((label, index) => {
      const record = professionalWorkingHours.find(
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
  }, [professionalWorkingHours]);

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
            businessId={businessId}
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
            businessId={businessId}
            value={selectedClient}
            onChange={setSelectedClient}
            disabled={isLoading}
          />

          <ProfessionalSelector
            businessId={businessId}
            value={selectedProfessional}
            onChange={setSelectedProfessional}
            disabled={isLoading}
          />

          {selectedProfessional && (
            <div className="space-y-2">
              <Label>Horário do professional</Label>
              {isLoadingProfessionalHours ? (
                <LoadingSpinner size="small" />
              ) : !professionalScheduleSummary.length ? (
                <p className="text-sm text-muted-foreground">
                  Este professional não tem horários de trabalho configurados.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {professionalScheduleSummary.map((item) => (
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
              !selectedProfessional ||
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
