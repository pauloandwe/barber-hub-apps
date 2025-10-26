import { useEffect, useState } from "react";
import { authAPI } from "@/api/auth";
import { businessAPI } from "@/api/business";
import { appointmentsAPI } from "@/api/appointments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AgendamentoDialog } from "@/components/AgendamentoDialog";

interface Barbearia {
  id: string;
  nome: string;
}

interface Agendamento {
  id: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  observacoes: string | null;
  barbeiros: { nome: string };
  servicos: { nome: string; duracao_min: number };
  barbearias: { nome: string };
}

const ClienteDashboard = () => {
  const navigate = useNavigate();
  const [barbearias, setBarbearias] = useState<Barbearia[]>([]);
  const [selectedBarbearia, setSelectedBarbearia] = useState<string>("");
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchBarbearias();
    fetchMeusAgendamentos();
  }, []);

  const fetchBarbearias = async () => {
    try {
      const businesses = await businessAPI.getAll();
      setBarbearias(
        businesses.map((b) => ({
          id: b.id.toString(),
          nome: b.name,
        }))
      );
    } catch (error) {
      console.error("Erro ao buscar barbearias:", error);
      toast.error("Erro ao carregar barbearias");
    } finally {
      setLoading(false);
    }
  };

  const fetchMeusAgendamentos = async () => {
    try {
      const user = authAPI.getStoredUser();
      if (!user) return;

      // Get all businesses and their appointments
      const businesses = await businessAPI.getAll();
      const allAppointments: Agendamento[] = [];

      for (const business of businesses) {
        const appointments = await appointmentsAPI.getAll(business.id);
        const userAppointments = appointments.filter(
          (apt) =>
            apt.clienteId === user.id &&
            new Date(apt.data_inicio) >= new Date()
        );
        allAppointments.push(
          ...userAppointments.map((apt) => ({
            id: apt.id.toString(),
            data_inicio: apt.data_inicio,
            data_fim: apt.data_fim,
            status: apt.status,
            observacoes: apt.observacoes || null,
            barbeiros: { nome: "Barbeiro" },
            servicos: { nome: "Serviço", duracao_min: 30 },
            barbearias: { nome: business.name },
          }))
        );
      }

      setAgendamentos(allAppointments);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast.error("Erro ao carregar agendamentos");
    }
  };

  const handleLogout = async () => {
    authAPI.logout();
    navigate("/login");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado": return "bg-green-100 text-green-800";
      case "pendente": return "bg-yellow-100 text-yellow-800";
      case "cancelado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
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
            <Button variant="outline" onClick={() => navigate("/perfil")}>
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
            <h2 className="text-3xl font-bold">Escolha uma Barbearia</h2>
            <p className="text-muted-foreground">Selecione uma barbearia para agendar</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Barbearias Disponíveis</CardTitle>
              <CardDescription>Escolha a barbearia de sua preferência</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedBarbearia} onValueChange={setSelectedBarbearia}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma barbearia" />
                </SelectTrigger>
                <SelectContent>
                  {barbearias.map((barbearia) => (
                    <SelectItem key={barbearia.id} value={barbearia.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {barbearia.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBarbearia && (
                <Button className="w-full mt-4" onClick={() => setDialogOpen(true)}>
                  Agendar Horário
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Meus Horários</h2>
            <p className="text-muted-foreground">Seus agendamentos futuros</p>
          </div>

          <div className="grid gap-4">
            {agendamentos.map((agendamento) => (
              <Card key={agendamento.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {format(new Date(agendamento.data_inicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </CardTitle>
                      <CardDescription>
                        {agendamento.servicos?.nome || "Serviço não disponível"} • {agendamento.servicos?.duracao_min || 0} min
                      </CardDescription>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(agendamento.status)}`}>
                      {agendamento.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Barbearia:</span>
                    <span>{agendamento.barbearias?.nome || "Barbearia não disponível"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Scissors className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Barbeiro:</span>
                    <span>{agendamento.barbeiros?.nome || "Barbeiro não disponível"}</span>
                  </div>
                  {agendamento.observacoes && (
                    <div className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                      <span className="font-medium">Observações:</span> {agendamento.observacoes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {agendamentos.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Você ainda não tem agendamentos</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <AgendamentoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        barbeariaId={selectedBarbearia}
        onSuccess={fetchMeusAgendamentos}
      />
    </div>
  );
};

export default ClienteDashboard;
