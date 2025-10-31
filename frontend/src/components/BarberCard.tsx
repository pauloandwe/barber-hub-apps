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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Barber as BarberModel } from "@/api/barbers";
import {
  barberWorkingHoursAPI,
  BarberWorkingHour,
} from "@/api/barberWorkingHours";
import { appointmentsAPI } from "@/api/appointments";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
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
              "Client not available",
          },
          service: appointment.service
            ? {
                name: appointment.service.name,
                duration: appointment.service.duration,
              }
            : { name: "Service not available", duration: 0 },
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
      return { label, text: "Not configured" };
    }

    if (record.closed) {
      return { label, text: "Closed" };
    }

    const range = `${record.openTime ?? "--:--"} – ${
      record.closeTime ?? "--:--"
    }`;
    if (record.breakStart && record.breakEnd) {
      return {
        label,
        text: `${range} (break ${record.breakStart}–${record.breakEnd})`,
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
                {barber.active ? "Active" : "Inactive"}
              </span>
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(barber)}
                >
                  Edit
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewSchedule}
                disabled={!onViewSchedule}
              >
                Manage schedule
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Working hours
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
              {isOpen ? "Hide Appointments" : "View Appointments"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            {isLoading ? (
              <LoadingSpinner size="small" />
            ) : appointments.length === 0 ? (
              <EmptyState
                title="No scheduled appointments"
                description="There are no appointments scheduled for this barber yet."
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
                          {format(
                            new Date(appointment.startDate),
                            "dd/MM/yyyy 'at' HH:mm",
                            {
                              locale: ptBR,
                            }
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {appointment.service?.name || "Service not available"}{" "}
                          • {appointment.service?.duration || 0} min
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Client:{" "}
                          {appointment.profile?.name || "Client not available"}
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
