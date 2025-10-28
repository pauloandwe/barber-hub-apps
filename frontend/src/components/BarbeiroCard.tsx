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

export interface Barber {
  id: string;
  name: string;
  bio?: string | null;
  active: boolean;
}

export interface BarberAppointment {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  profile: { name: string };
  service: { name: string; duration: number };
}

interface BarberCardProps {
  barber: Barber;
  onViewSchedule?: (barberId: string) => void;
}

export function BarberCard({ barber, onViewSchedule }: BarberCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [appointments, setAppointments] = useState<BarberAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAppointments();
    }
  }, [isOpen]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      setAppointments([]);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching appointments:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewSchedule = () => {
    if (onViewSchedule) {
      onViewSchedule(barber.id);
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
              {barber.bio && <CardDescription>{barber.bio}</CardDescription>}
            </div>
            <div className="flex gap-2 ml-4">
              <span
                className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                  barber.active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {barber.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full">
              <Clock className="mr-2 h-4 w-4" />
              {isOpen ? "Hide Schedule" : "View Schedule"}
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
