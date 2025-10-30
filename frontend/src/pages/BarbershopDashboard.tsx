import { useEffect, useRef, useState } from "react";
import { authAPI } from "@/api/auth";
import { appointmentsAPI } from "@/api/appointments";
import { Barber, barbersAPI } from "@/api/barbers";
import { Service as ServiceModel, servicesAPI } from "@/api/services";
import { businessAPI, Business } from "@/api/business";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Scissors,
  Calendar,
  User,
  LogOut,
  Plus,
  Building2,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ServiceDialog } from "@/components/ServiceDialog";
import { BarberDialog } from "@/components/BarberDialog";
import { BarberCard } from "@/components/BarberCard";
import { BarberScheduleDialog } from "@/components/BarberScheduleDialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ROUTES } from "@/constants/routes";

interface Appointment {
  id: number;
  startDate: string;
  endDate: string;
  status: string;
  notes?: string;
  barber?: { name: string };
  client?: { name: string };
  service?: { name: string; duration: number };
}

export function BarbershopDashboard() {
  const navigate = useNavigate();
  const { barbershopId, isLoading: roleLoading } = useUserRole();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceModel[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [barbershopInfo, setBarbershopInfo] = useState<
    (Business & { nome?: string }) | null
  >(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isBarberDialogOpen, setIsBarberDialogOpen] = useState(false);
  const [serviceDialogData, setServiceDialogData] =
    useState<ServiceModel | null>(null);
  const [barberDialogData, setBarberDialogData] = useState<Barber | null>(null);
  const [isBusinessDialogOpen, setIsBusinessDialogOpen] = useState(false);
  const [businessForm, setBusinessForm] = useState({ name: "", phone: "" });
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [scheduleVersion, setScheduleVersion] = useState(0);
  const hasWarnedWithoutBarbershop = useRef(false);
  const barbershopDisplayName =
    barbershopInfo?.name || (barbershopInfo as any)?.nome || "My Barbershop";

  useEffect(() => {
    if (roleLoading) return;

    if (!barbershopId) {
      if (!hasWarnedWithoutBarbershop.current) {
        toast.error(
          "Não foi possível encontrar uma barbearia vinculada ao seu usuário"
        );
        hasWarnedWithoutBarbershop.current = true;
      }
      setIsLoading(false);
      return;
    }
    hasWarnedWithoutBarbershop.current = false;

    fetchData(barbershopId);
  }, [barbershopId, roleLoading]);

  const fetchData = async (targetBarbershopId: string | number) => {
    try {
      const barbershopIdNum =
        typeof targetBarbershopId === "string"
          ? parseInt(targetBarbershopId, 10)
          : targetBarbershopId;

      const business = await businessAPI.getById(barbershopIdNum);
      setBarbershopInfo(business);

      const appts = await appointmentsAPI.getAll(barbershopIdNum);
      const futureAppointments = appts.filter(
        (apt: any) => new Date(apt.startDate) >= new Date()
      );
      setAppointments(futureAppointments);

      const svcs = await servicesAPI.getAll(barbershopIdNum);
      setServices(svcs);

      const brbs = await barbersAPI.getAll(barbershopIdNum);
      setBarbers(brbs);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching data:", error);
      }
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const openBusinessDialog = () => {
    if (!barbershopInfo) {
      return;
    }

    setBusinessForm({
      name: barbershopInfo.name || (barbershopInfo as any).nome || "",
      phone: barbershopInfo.phone || "",
    });
    setIsBusinessDialogOpen(true);
  };

  const resetBusinessForm = () => {
    setBusinessForm({ name: "", phone: "" });
    setIsSavingBusiness(false);
  };

  const handleUpdateBusiness = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!barbershopId) {
      toast.error("Nenhuma barbearia associada a esta conta");
      return;
    }

    const barbershopIdNum = parseInt(barbershopId, 10);
    if (Number.isNaN(barbershopIdNum)) {
      toast.error("Identificador de barbearia inválido");
      return;
    }

    setIsSavingBusiness(true);
    try {
      await businessAPI.update(barbershopIdNum, {
        name: businessForm.name,
        phone: businessForm.phone || undefined,
      });

      toast.success("Barbearia atualizada com sucesso!");
      setIsBusinessDialogOpen(false);
      resetBusinessForm();
      fetchData(barbershopIdNum);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error updating barbershop:", error);
      }
      toast.error("Erro ao atualizar barbearia");
    } finally {
      setIsSavingBusiness(false);
    }
  };

  const openServiceDialog = (service?: ServiceModel | null) => {
    setServiceDialogData(service ?? null);
    setIsServiceDialogOpen(true);
  };

  const openBarberDialog = (barber?: Barber | null) => {
    setBarberDialogData(barber ?? null);
    setIsBarberDialogOpen(true);
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
            <h1 className="text-xl font-bold">{barbershopDisplayName}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={openBusinessDialog}
              disabled={!barbershopInfo}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Editar Barbearia
            </Button>
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
        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="barbers">Barbeiros</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Agendamentos</h2>
                <p className="text-muted-foreground">Horários agendados</p>
              </div>
            </div>

            <div className="grid gap-4">
              {appointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          {format(
                            new Date(appointment.startDate),
                            "dd/MM/yyyy 'at' HH:mm",
                            {
                              locale: ptBR,
                            }
                          )}
                        </CardTitle>
                        <CardDescription>
                          {appointment.service?.name ||
                            "Serviço não disponível"}{" "}
                          • {appointment.service?.duration || 0} min
                        </CardDescription>
                      </div>
                      <StatusBadge status={appointment.status as any} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Cliente:</span>
                      <span>
                        {appointment.client?.name || "Cliente não disponível"}
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
                        <span className="font-medium">Observações:</span>{" "}
                        {appointment.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {appointments.length === 0 && (
              <EmptyState
                title="Nenhum agendamento futuro"
                description="Os agendamentos aparecerão aqui quando forem programados"
                icon="📅"
              />
            )}
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Serviços</h2>
                <p className="text-muted-foreground">Gerencie seus serviços</p>
              </div>
              <Button onClick={() => openServiceDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Serviço
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{service.name}</CardTitle>
                        <CardDescription>
                          R$ {(service.price / 100).toFixed(2)} •{" "}
                          {service.duration} min
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openServiceDialog(service)}
                      >
                        Editar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        service.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {service.active ? "Ativo" : "Inativo"}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {services.length === 0 && (
              <EmptyState
                title="Nenhum serviço registrado"
                description="Crie seu primeiro serviço para começar"
                icon="✂️"
              />
            )}
          </TabsContent>

          <TabsContent value="barbers" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Barbeiros</h2>
                <p className="text-muted-foreground">
                  Gerencie sua equipe e horários
                </p>
              </div>
              <Button onClick={() => openBarberDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Barbeiro
              </Button>
            </div>

            <div className="grid gap-4">
              {barbers?.map((barber) => (
                <BarberCard
                  key={barber.id}
                  barber={barber}
                  onViewSchedule={(barber) => {
                    setSelectedBarber(barber);
                    setIsScheduleDialogOpen(true);
                  }}
                  onEdit={(barber) => openBarberDialog(barber)}
                  scheduleVersion={scheduleVersion}
                />
              ))}
            </div>

            {barbers.length === 0 && (
              <EmptyState
                title="Nenhum barbeiro registrado"
                description="Adicione seu primeiro barbeiro à equipe"
                icon="👨‍💼"
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog
        open={isBusinessDialogOpen}
        onOpenChange={(open) => {
          setIsBusinessDialogOpen(open);
          if (!open) {
            resetBusinessForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Barbearia</DialogTitle>
            <DialogDescription>
              Atualize as informações de sua barbearia abaixo
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateBusiness} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business-name">Nome *</Label>
              <Input
                id="business-name"
                value={businessForm.name}
                onChange={(e) =>
                  setBusinessForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-phone">Telefone *</Label>
              <Input
                id="business-phone"
                value={businessForm.phone}
                onChange={(e) =>
                  setBusinessForm((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetBusinessForm();
                  setIsBusinessDialogOpen(false);
                }}
                disabled={isSavingBusiness}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingBusiness}>
                {isSavingBusiness && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar mudanças
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ServiceDialog
        open={isServiceDialogOpen}
        onOpenChange={(open) => {
          setIsServiceDialogOpen(open);
          if (!open) {
            setServiceDialogData(null);
          }
        }}
        barbershopId={barbershopId || ""}
        onSuccess={() => fetchData(barbershopId || "")}
        service={serviceDialogData}
      />

      <BarberDialog
        open={isBarberDialogOpen}
        onOpenChange={(open) => {
          setIsBarberDialogOpen(open);
          if (!open) {
            setBarberDialogData(null);
          }
        }}
        barbershopId={barbershopId || ""}
        onSuccess={() => fetchData(barbershopId || "")}
        barber={barberDialogData}
      />

      <BarberScheduleDialog
        open={isScheduleDialogOpen}
        onOpenChange={(open) => {
          setIsScheduleDialogOpen(open);
          if (!open) {
            setSelectedBarber(null);
          }
        }}
        barber={selectedBarber}
        onSaved={() => setScheduleVersion((value) => value + 1)}
      />
    </div>
  );
}

export default BarbershopDashboard;
