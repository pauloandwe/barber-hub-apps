import { useEffect, useRef, useState } from "react";
import { authAPI } from "@/api/auth";
import { Professional, professionalsAPI } from "@/api/professionals";
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
  Calendar,
  User,
  LogOut,
  Plus,
  Building2,
  Loader2,
  Bell,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { ServiceDialog } from "@/components/ServiceDialog";
import { ProfessionalDialog } from "@/components/ProfessionalDialog";
import { ProfessionalCard } from "@/components/ProfessionalCard";
import { ProfessionalScheduleDialog } from "@/components/ProfessionalScheduleDialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { AppointmentTimelineView } from "@/components/appointments/timeline/AppointmentTimelineView";
import { ROUTES } from "@/constants/routes";

export function BusinessDashboard() {
  const navigate = useNavigate();
  const { businessId, isLoading: roleLoading } = useUserRole();
  const [services, setServices] = useState<ServiceModel[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [barbershopInfo, setProfessionalshopInfo] = useState<
    (Business & { nome?: string }) | null
  >(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isProfessionalDialogOpen, setIsProfessionalDialogOpen] = useState(false);
  const [serviceDialogData, setServiceDialogData] =
    useState<ServiceModel | null>(null);
  const [professionalDialogData, setProfessionalDialogData] = useState<Professional | null>(null);
  const [isBusinessDialogOpen, setIsBusinessDialogOpen] = useState(false);
  const [businessForm, setBusinessForm] = useState({ name: "", phone: "" });
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [scheduleVersion, setScheduleVersion] = useState(0);
  const hasWarnedWithoutBarbershop = useRef(false);
  const barbershopDisplayName =
    barbershopInfo?.name || (barbershopInfo as any)?.nome || "My Business";

  useEffect(() => {
    if (roleLoading) return;

    if (!businessId) {
      if (!hasWarnedWithoutBarbershop.current) {
        toast.error(
          "Não foi possível encontrar uma business vinculada ao seu usuário"
        );
        hasWarnedWithoutBarbershop.current = true;
      }
      setIsLoading(false);
      return;
    }
    hasWarnedWithoutBarbershop.current = false;

    fetchData(businessId);
  }, [businessId, roleLoading]);

  const fetchData = async (targetBarbershopId: string | number) => {
    try {
      const businessIdNum =
        typeof targetBarbershopId === "string"
          ? parseInt(targetBarbershopId, 10)
          : targetBarbershopId;

      const business = await businessAPI.getById(businessIdNum);
      setProfessionalshopInfo(business);

      const svcs = await servicesAPI.getAll(businessIdNum);
      setServices(svcs);

      const brbs = await professionalsAPI.getAll(businessIdNum);
      setProfessionals(brbs);
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

    if (!businessId) {
      toast.error("Nenhuma business associada a esta conta");
      return;
    }

    const businessIdNum = parseInt(businessId, 10);
    if (Number.isNaN(businessIdNum)) {
      toast.error("Identificador de business inválido");
      return;
    }

    setIsSavingBusiness(true);
    try {
      await businessAPI.update(businessIdNum, {
        name: businessForm.name,
        phone: businessForm.phone || undefined,
      });

      toast.success("Business atualizada com sucesso!");
      setIsBusinessDialogOpen(false);
      resetBusinessForm();
      fetchData(businessIdNum);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error updating business:", error);
      }
      toast.error("Erro ao atualizar business");
    } finally {
      setIsSavingBusiness(false);
    }
  };

  const openServiceDialog = (service?: ServiceModel | null) => {
    setServiceDialogData(service ?? null);
    setIsServiceDialogOpen(true);
  };

  const openBarberDialog = (professional?: Professional | null) => {
    setProfessionalDialogData(professional ?? null);
    setIsProfessionalDialogOpen(true);
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
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">{barbershopDisplayName}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.BARBERSHOP_REMINDERS)}
            >
              <Bell className="mr-2 h-4 w-4" />
              Lembretes
            </Button>
            <Button
              variant="outline"
              onClick={openBusinessDialog}
              disabled={!barbershopInfo}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Editar Business
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
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeline">📅 Agenda</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="professionals">Barbeiros</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            {businessId && (
              <AppointmentTimelineView businessId={parseInt(businessId, 10)} />
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
                          R$ {Number(service.price).toFixed(2)} •{" "}
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

          <TabsContent value="professionals" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Barbeiros</h2>
                <p className="text-muted-foreground">
                  Gerencie sua equipe e horários
                </p>
              </div>
              <Button onClick={() => openBarberDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Professional
              </Button>
            </div>

            <div className="grid gap-4">
              {professionals?.map((professional) => (
                <ProfessionalCard
                  key={professional.id}
                  professional={professional}
                  onViewSchedule={(professional) => {
                    setSelectedProfessional(professional);
                    setIsScheduleDialogOpen(true);
                  }}
                  onEdit={(professional) => openBarberDialog(professional)}
                  scheduleVersion={scheduleVersion}
                />
              ))}
            </div>

            {professionals.length === 0 && (
              <EmptyState
                title="Nenhum professional registrado"
                description="Adicione seu primeiro professional à equipe"
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
            <DialogTitle>Editar Business</DialogTitle>
            <DialogDescription>
              Atualize as informações de sua business abaixo
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
        businessId={businessId || ""}
        onSuccess={() => fetchData(businessId || "")}
        service={serviceDialogData}
      />

      <ProfessionalDialog
        open={isProfessionalDialogOpen}
        onOpenChange={(open) => {
          setIsProfessionalDialogOpen(open);
          if (!open) {
            setProfessionalDialogData(null);
          }
        }}
        businessId={businessId || ""}
        onSuccess={() => fetchData(businessId || "")}
        professional={professionalDialogData}
      />

      <ProfessionalScheduleDialog
        open={isScheduleDialogOpen}
        onOpenChange={(open) => {
          setIsScheduleDialogOpen(open);
          if (!open) {
            setSelectedProfessional(null);
          }
        }}
        professional={selectedProfessional}
        onSaved={() => setScheduleVersion((value) => value + 1)}
      />
    </div>
  );
}

export default BusinessDashboard;
