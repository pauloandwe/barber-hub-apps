import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User as UserIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatUtcDateTime } from "@/utils/date.utils";
import { Barber as BarberModel } from "@/api/barbers";
import {
  barberWorkingHoursAPI,
  BarberWorkingHour,
} from "@/api/barberWorkingHours";
import { appointmentsAPI } from "@/api/appointments";

const DAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export interface BarberAppointment {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  profile: { name: string };
  service: { name: string; duration: number };
}

interface BarberCardProps {
  barber: BarberModel;
  onViewSchedule?: (barber: BarberModel) => void;
  onEdit?: (barber: BarberModel) => void;
  scheduleVersion?: number;
}

export function BarberCard({
  barber,
  onViewSchedule,
  onEdit,
  scheduleVersion = 0,
}: BarberCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [appointments, setAppointments] = useState<BarberAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workingHours, setWorkingHours] = useState<BarberWorkingHour[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAppointments();
    }
  }, [isOpen]);

  useEffect(() => {
    loadWorkingHours();
  }, [barber.id, scheduleVersion]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      setAppointments([]);

      if (!barber.businessId) {
        setAppointments([]);
        return;
      }

      const data = await appointmentsAPI.getAll(barber.businessId);
      const filteredAppointments = data.filter(
        (appointment) => appointment.barberId === barber.id
      );

      const normalizedAppointments: BarberAppointment[] =
        filteredAppointments.map((appointment) => ({
          id: String(appointment.id),
          startDate: appointment.startDate,
          endDate: appointment.endDate,
          status: appointment.status,
          profile: {
            name:
              appointment.client?.name ||
              appointment.clientContact?.name ||
              appointment.clientContact?.phone ||
              appointment.barber?.name ||
              "Cliente não disponível",
          },
          service: appointment.service
            ? {
                name: appointment.service.name,
                duration: appointment.service.duration,
              }
            : { name: "Serviço não disponível", duration: 0 },
        }));

      normalizedAppointments.sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

      setAppointments(normalizedAppointments);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching appointments:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkingHours = async () => {
    setIsLoadingSchedule(true);
    try {
      const data = await barberWorkingHoursAPI.getAll(barber.id);
      setWorkingHours(Array.isArray(data) ? data : []);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching working hours:", error);
      }
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const workingHoursByDay = DAY_LABELS.map((label, index) => {
    const record = workingHours.find((item) => item.dayOfWeek === index);

    if (!record) {
      return { label, text: "Não configurado" };
    }

    if (record.closed) {
      return { label, text: "Fechado" };
    }

    const range = `${record.openTime ?? "--:--"} – ${
      record.closeTime ?? "--:--"
    }`;
    if (record.breakStart && record.breakEnd) {
      return {
        label,
        text: `${range} (pausa ${record.breakStart}–${record.breakEnd})`,
      };
    }

    return { label, text: range };
  });

  const handleViewSchedule = () => {
    if (onViewSchedule) {
      onViewSchedule(barber);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                {barber.name}
              </CardTitle>
              {barber.specialties && barber.specialties.length > 0 && (
                <CardDescription>
                  {barber.specialties.join(", ")}
                </CardDescription>
              )}
            </div>
            <div className="flex gap-2 ml-4 items-center">
              <span
                className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                  barber.active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {barber.active ? "Ativo" : "Inativo"}
              </span>
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(barber)}
                >
                  Editar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewSchedule}
                disabled={!onViewSchedule}
              >
                Gerenciar horário
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Horário de trabalho
            </p>
            {isLoadingSchedule ? (
              <LoadingSpinner size="small" />
            ) : (
              <div className="grid gap-1 text-sm sm:grid-cols-2">
                {workingHoursByDay.map((entry) => (
                  <div key={entry.label} className="flex justify-between gap-3">
                    <span className="font-medium">{entry.label}</span>
                    <span className="text-muted-foreground text-right">
                      {entry.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full">
              <Clock className="mr-2 h-4 w-4" />
              {isOpen ? "Ocultar Agendamentos" : "Ver Agendamentos"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            {isLoading ? (
              <LoadingSpinner size="small" />
            ) : appointments.length === 0 ? (
              <EmptyState
                title="Nenhum agendamento agendado"
                description="Não há agendamentos programados para este barbeiro ainda."
              />
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatUtcDateTime(appointment.startDate)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {appointment.service?.name ||
                            "Serviço não disponível"}{" "}
                          • {appointment.service?.duration || 0} min
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cliente:{" "}
                          {appointment.profile?.name ||
                            "Cliente não disponível"}
                        </p>
                      </div>
                      <StatusBadge status={appointment.status as any} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

export default BarberCard;
