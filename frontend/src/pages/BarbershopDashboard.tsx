import { useEffect, useRef, useState } from 'react';
import { authAPI } from '@/api/auth';
import { appointmentsAPI } from '@/api/appointments';
import { Barber, barbersAPI } from '@/api/barbers';
import { servicesAPI } from '@/api/services';
import { businessAPI } from '@/api/business';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Scissors, Calendar, User, LogOut, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ServiceDialog } from '@/components/ServiceDialog';
import { BarberDialog } from '@/components/BarberDialog';
import { BarberCard } from '@/components/BarberCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ROUTES } from '@/constants/routes';

interface Appointment {
  id: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  observacoes: string | null;
  barbers: { nome: string };
  profiles: { nome: string };
  services: { nome: string; duracao_min: number };
}

interface Service {
  id: string;
  nome: string;
  preco_centavos: number;
  duracao_min: number;
  ativo: boolean;
}

export function BarbershopDashboard() {
  const navigate = useNavigate();
  const { barbershopId, isLoading: roleLoading } = useUserRole();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [barbershopInfo, setBarbershopInfo] = useState<{ name?: string; nome?: string } | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isBarberDialogOpen, setIsBarberDialogOpen] = useState(false);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const hasWarnedWithoutBarbershop = useRef(false);

  useEffect(() => {
    if (roleLoading) return;

    if (!barbershopId) {
      if (!hasWarnedWithoutBarbershop.current) {
        toast.error('Could not find a barbershop linked to your user');
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
        typeof targetBarbershopId === 'string' ? parseInt(targetBarbershopId, 10) : targetBarbershopId;

      const business = await businessAPI.getById(barbershopIdNum);
      setBarbershopInfo(business);

      const appts = await appointmentsAPI.getAll(barbershopIdNum);
      const futureAppointments = appts.filter((apt: any) => new Date(apt.data_inicio) >= new Date());
      setAppointments(futureAppointments);

      const svcs = await servicesAPI.getAll(barbershopIdNum);
      setServices(svcs);

      const brbs = await barbersAPI.getAll(barbershopIdNum);
      setBarbers(brbs);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching data:', error);
      }
      toast.error('Error loading data');
    } finally {
      setIsLoading(false);
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
            <h1 className="text-xl font-bold">
              {barbershopInfo?.name || barbershopInfo?.nome || 'My Barbershop'}
            </h1>
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
        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="barbers">Barbers</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Appointments</h2>
                <p className="text-muted-foreground">Scheduled times</p>
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
                          {format(new Date(appointment.data_inicio), "dd/MM/yyyy 'at' HH:mm", {
                            locale: ptBR,
                          })}
                        </CardTitle>
                        <CardDescription>
                          {appointment.services?.nome || 'Service not available'} •{' '}
                          {appointment.services?.duracao_min || 0} min
                        </CardDescription>
                      </div>
                      <StatusBadge status={appointment.status as any} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Client:</span>
                      <span>{appointment.profiles?.nome || 'Client not available'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Scissors className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Barber:</span>
                      <span>{appointment.barbers?.nome || 'Barber not available'}</span>
                    </div>
                    {appointment.observacoes && (
                      <div className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                        <span className="font-medium">Notes:</span> {appointment.observacoes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {appointments.length === 0 && (
              <EmptyState
                title="No future appointments"
                description="Appointments will appear here once they are scheduled"
                icon="📅"
              />
            )}
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Services</h2>
                <p className="text-muted-foreground">Manage your services</p>
              </div>
              <Button onClick={() => setIsServiceDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Service
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardHeader>
                    <CardTitle>{service.nome}</CardTitle>
                    <CardDescription>
                      ${(service.preco_centavos / 100).toFixed(2)} • {service.duracao_min} min
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className={`text-xs px-2 py-1 rounded ${
                      service.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {service.ativo ? 'Active' : 'Inactive'}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {services.length === 0 && (
              <EmptyState
                title="No services registered"
                description="Create your first service to get started"
                icon="✂️"
              />
            )}
          </TabsContent>

          <TabsContent value="barbers" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Barbers</h2>
                <p className="text-muted-foreground">Manage your team and schedules</p>
              </div>
              <Button onClick={() => setIsBarberDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Barber
              </Button>
            </div>

            <div className="grid gap-4">
              {barbers?.map((barber) => (
                <BarberCard
                  key={barber.id}
                  barber={barber}
                  onViewSchedule={(id) => {
                    setSelectedBarberId(id);
                  }}
                />
              ))}
            </div>

            {barbers.length === 0 && (
              <EmptyState
                title="No barbers registered"
                description="Add your first barber to the team"
                icon="👨‍💼"
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <ServiceDialog
        open={isServiceDialogOpen}
        onOpenChange={setIsServiceDialogOpen}
        barbershopId={barbershopId || ''}
        onSuccess={() => fetchData(barbershopId || '')}
      />

      <BarberDialog
        open={isBarberDialogOpen}
        onOpenChange={setIsBarberDialogOpen}
        barbershopId={barbershopId || ''}
        onSuccess={() => fetchData(barbershopId || '')}
      />
    </div>
  );
}

export default BarbershopDashboard;
