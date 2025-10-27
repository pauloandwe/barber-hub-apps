import { useState, useEffect } from "react";
import { authAPI } from "@/api/auth";
import { appointmentsAPI } from "@/api/appointments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Barber {
  id: string;
  name: string;
  bio: string | null;
  active: boolean;
}

interface Appointment {
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

export const BarbeiroCard = ({ barber }: BarberCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAppointments();
    }
  }, [isOpen]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // TODO: Fetch appointments filtered by barberId from business context
      // For now, loading empty list as we need business context
      setAppointments([]);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado": return "bg-green-100 text-green-800";
      case "pendente": return "bg-yellow-100 text-yellow-800";
      case "cancelado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                {barber.name}
              </CardTitle>
              {barber.bio && <CardDescription>{barber.bio}</CardDescription>}
            </div>
            <div className="flex gap-2">
              <span className={`text-xs px-2 py-1 rounded ${barber.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                {barber.active ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full">
              <Clock className="mr-2 h-4 w-4" />
              {isOpen ? "Ocultar Horários" : "Ver Horários"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum horário agendado
              </p>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(appointment.startDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {appointment.service?.name || "Serviço não disponível"} • {appointment.service?.duration || 0} min
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cliente: {appointment.profile?.name || "Cliente não disponível"}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
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
};
