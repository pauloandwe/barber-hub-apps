import { useEffect, useState } from "react";
import { authAPI } from "@/api/auth";
import { businessAPI } from "@/api/business";
import {
  Appointment as AppointmentModel,
  appointmentsAPI,
} from "@/api/appointments";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Scissors,
  Calendar,
  Building2,
  LogOut,
  User,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDateTime } from "@/utils/date.utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppointmentDialog } from "@/components/AppointmentDialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ROUTES } from "@/constants/routes";

interface Barbershop {
  id: string;
  name: string;
}

type DashboardAppointment = AppointmentModel & { barbershopName?: string };

export function ClientDashboard() {
  const navigate = useNavigate();
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [selectedBarbershop, setSelectedBarbershop] = useState<string>("");
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [appointmentBeingEdited, setAppointmentBeingEdited] =
    useState<DashboardAppointment | null>(null);

  const dialogBarbershopId = appointmentBeingEdited
    ? appointmentBeingEdited.businessId.toString()
    : selectedBarbershop;

  useEffect(() => {
    fetchBarbershops();
    fetchMyAppointments();
  }, []);

  const fetchBarbershops = async () => {
    try {
      const businesses = await businessAPI.getAll();
      setBarbershops(
        businesses.map((b) => ({
          id: b.id.toString(),
          name: b.name,
        }))
      );
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching barbershops:", error);
      }
      toast.error("Erro ao carregar barbearias");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyAppointments = async () => {
    try {
      const user = authAPI.getStoredUser();
      if (!user) return;

      const businesses = await businessAPI.getAll();
      const allAppointments: DashboardAppointment[] = [];

      for (const business of businesses) {
        const businessId =
          typeof business.id === "string"
            ? parseInt(business.id, 10)
            : business.id;

        if (Number.isNaN(businessId)) {
          continue;
        }

        const businessAppointments = await appointmentsAPI.getAll(businessId);
        const userAppointments = businessAppointments.filter(
          (apt) =>
            apt.clientId === user.id && new Date(apt.startDate) >= new Date()
        );

        userAppointments.forEach((apt) => {
          allAppointments.push({
            ...apt,
            barbershopName: business.name,
          });
        });
      }

      setAppointments(allAppointments);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching appointments:", error);
      }
      toast.error("Erro ao carregar agendamentos");
    }
  };

  const handleEditAppointment = (appointment: DashboardAppointment) => {
    setAppointmentBeingEdited(appointment);
    setIsAppointmentDialogOpen(true);
  };

  const handleDeleteAppointment = async (appointment: DashboardAppointment) => {
    if (
      !window.confirm(
        `Tem certeza que deseja deletar o agendamento de ${formatDateTime(
          appointment.startDate
        )}?`
      )
    ) {
      return;
    }

    try {
      await appointmentsAPI.delete(appointment.businessId, appointment.id);
      toast.success("Agendamento deletado com sucesso!");
      setAppointments(appointments.filter((apt) => apt.id !== appointment.id));
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error deleting appointment:", error);
      }
      toast.error("Erro ao deletar agendamento");
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate(ROUTES.LOGIN);
  };

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Meus Agendamentos</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(ROUTES.PROFILE)}>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-3xl font-bold">Selecione uma Barbearia</h2>
            <p className="text-muted-foreground">
              Escolha uma barbearia para agendar um horário
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Barbearias Disponíveis</CardTitle>
              <CardDescription>Escolha sua barbearia preferida</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedBarbershop}
                onValueChange={setSelectedBarbershop}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar uma barbearia" />
                </SelectTrigger>
                <SelectContent>
                  {barbershops.map((barbershop) => (
                    <SelectItem key={barbershop.id} value={barbershop.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {barbershop.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBarbershop && (
                <Button
                  className="w-full mt-4"
                  onClick={() => {
                    setAppointmentBeingEdited(null);
                    setIsAppointmentDialogOpen(true);
                  }}
                >
                  Agendar Horário
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Meus Agendamentos</h2>
            <p className="text-muted-foreground">Seus próximos agendamentos</p>
          </div>

          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {formatDateTime(appointment.startDate)}
                      </CardTitle>
                      <CardDescription>
                        {appointment.service?.name || "Serviço não disponível"}{" "}
                        • {appointment.service?.duration || 0} min
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={appointment.status as any} />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAppointment(appointment)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAppointment(appointment)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Barbearia:</span>
                    <span>
                      {appointment.barbershopName || "Barbearia não disponível"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Scissors className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Barbeiro:</span>
                    <span>
                      {appointment.barber?.name || "Barbeiro não disponível"}
                    </span>
                  </div>
                  {appointment.notes && (
                    <div className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                      <span className="font-medium">Notas:</span>{" "}
                      {appointment.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {appointments.length === 0 && (
            <EmptyState
              title="Nenhum agendamento ainda"
              description="Agende um horário para começar"
              icon="📅"
            />
          )}
        </div>
      </main>

      <AppointmentDialog
        open={isAppointmentDialogOpen}
        onOpenChange={(open) => {
          setIsAppointmentDialogOpen(open);
          if (!open) {
            setAppointmentBeingEdited(null);
          }
        }}
        barbershopId={dialogBarbershopId}
        onSuccess={fetchMyAppointments}
        appointment={appointmentBeingEdited}
      />
    </div>
  );
}

export default ClientDashboard;
