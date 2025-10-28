import { useEffect, useState } from "react";
import { authAPI } from "@/api/auth";
import { businessAPI } from "@/api/business";
import { appointmentsAPI } from "@/api/appointments";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Scissors, Calendar, Building2, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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

interface Appointment {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  notes?: string;
  barber?: { name: string };
  service?: { name: string; duration: number };
  barbershop?: { name: string };
}

export function ClientDashboard() {
  const navigate = useNavigate();
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [selectedBarbershop, setSelectedBarbershop] = useState<string>("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);

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
      toast.error("Error loading barbershops");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyAppointments = async () => {
    try {
      const user = authAPI.getStoredUser();
      if (!user) return;

      const businesses = await businessAPI.getAll();
      const allAppointments: Appointment[] = [];

      for (const business of businesses) {
        const appointments = await appointmentsAPI.getAll(business.id);
        const userAppointments = appointments.filter(
          (apt) =>
            apt.clientId === user.id && new Date(apt.startDate) >= new Date()
        );
        allAppointments.push(
          ...userAppointments.map((apt) => ({
            id: apt.id.toString(),
            startDate: apt.startDate,
            endDate: apt.endDate,
            status: apt.status,
            notes: apt.notes,
            barber: apt.barber,
            service: apt.service,
            barbershop: { name: business.name },
          }))
        );
      }

      setAppointments(allAppointments);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching appointments:", error);
      }
      toast.error("Error loading appointments");
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
            <h1 className="text-xl font-bold">My Appointments</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(ROUTES.PROFILE)}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-3xl font-bold">Select a Barbershop</h2>
            <p className="text-muted-foreground">
              Choose a barbershop to schedule an appointment
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Available Barbershops</CardTitle>
              <CardDescription>
                Choose your preferred barbershop
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedBarbershop}
                onValueChange={setSelectedBarbershop}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a barbershop" />
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
                  onClick={() => setIsAppointmentDialogOpen(true)}
                >
                  Schedule Appointment
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">My Appointments</h2>
            <p className="text-muted-foreground">Your upcoming appointments</p>
          </div>

          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {format(
                          new Date(appointment.startDate),
                          "dd/MM/yyyy 'at' HH:mm",
                          { locale: ptBR }
                        )}
                      </CardTitle>
                      <CardDescription>
                        {appointment.service?.name || "Service not available"}{" "}
                        • {appointment.service?.duration || 0} min
                      </CardDescription>
                    </div>
                    <StatusBadge status={appointment.status as any} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Barbershop:</span>
                    <span>
                      {appointment.barbershop?.name ||
                        "Barbershop not available"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Scissors className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Barber:</span>
                    <span>
                      {appointment.barber?.name || "Barber not available"}
                    </span>
                  </div>
                  {appointment.notes && (
                    <div className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                      <span className="font-medium">Notes:</span>{" "}
                      {appointment.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {appointments.length === 0 && (
            <EmptyState
              title="No appointments yet"
              description="Schedule an appointment to get started"
              icon="📅"
            />
          )}
        </div>
      </main>

      <AppointmentDialog
        open={isAppointmentDialogOpen}
        onOpenChange={setIsAppointmentDialogOpen}
        barbershopId={selectedBarbershop}
        onSuccess={fetchMyAppointments}
      />
    </div>
  );
}

export default ClientDashboard;
