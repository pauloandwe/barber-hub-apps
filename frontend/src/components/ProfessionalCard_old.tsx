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

export interface Professional {
  id: string;
  name: string;
  bio?: string | null;
  active: boolean;
}

export interface ProfessionalAppointment {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  profile: { name: string };
  service: { name: string; duration: number };
}

interface ProfessionalCardProps {
  professional: Professional;
  onViewSchedule?: (professionalId: string) => void;
}

export function ProfessionalCard({ professional, onViewSchedule }: ProfessionalCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [appointments, setAppointments] = useState<ProfessionalAppointment[]>([]);
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
      onViewSchedule(professional.id);
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
                {professional.name}
              </CardTitle>
              {professional.bio && <CardDescription>{professional.bio}</CardDescription>}
            </div>
            <div className="flex gap-2 ml-4">
              <span
                className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                  professional.active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {professional.active ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full">
              <Clock className="mr-2 h-4 w-4" />
              {isOpen ? "Ocultar Horário" : "Ver Horário"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            {isLoading ? (
              <LoadingSpinner size="small" />
            ) : appointments.length === 0 ? (
              <EmptyState
                title="Nenhum agendamento programado"
                description="Não há agendamentos programados para este professional ainda."
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

export default ProfessionalCard;
