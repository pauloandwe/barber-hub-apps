import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Scissors, Calendar, User, LogOut, Plus, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ServicoDialog } from "@/components/ServicoDialog";
import { BarbeiroDialog } from "@/components/BarbeiroDialog";
import { BarbeiroCard } from "@/components/BarbeiroCard";

interface Agendamento {
  id: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  observacoes: string | null;
  barbeiros: { nome: string };
  profiles: { nome: string };
  servicos: { nome: string; duracao_min: number };
}

interface Servico {
  id: string;
  nome: string;
  preco_centavos: number;
  duracao_min: number;
  ativo: boolean;
}

interface Barbeiro {
  id: string;
  nome: string;
  bio: string | null;
  ativo: boolean;
}

const BarbeariaDashboard = () => {
  const navigate = useNavigate();
  const { barbeariaId } = useUserRole();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [barbeariaInfo, setBarbeariaInfo] = useState<any>(null);
  const [servicoDialogOpen, setServicoDialogOpen] = useState(false);
  const [barbeiroDialogOpen, setBarbeiroDialogOpen] = useState(false);
  const [selectedBarbeiroId, setSelectedBarbeiroId] = useState<string>("");

  useEffect(() => {
    if (barbeariaId) {
      fetchData();
    }
  }, [barbeariaId]);

  const fetchData = async () => {
    if (!barbeariaId) return;

    try {
      // Buscar info da barbearia
      const { data: barbeariaData } = await supabase
        .from("barbearias")
        .select("*")
        .eq("id", barbeariaId)
        .single();

      setBarbeariaInfo(barbeariaData);

      // Buscar agendamentos da barbearia
      const { data, error } = await supabase
        .from("agendamentos")
        .select(`
          *,
          barbeiros (nome),
          profiles (nome),
          servicos (nome, duracao_min)
        `)
        .eq("barbearia_id", barbeariaId)
        .gte("data_inicio", new Date().toISOString())
        .order("data_inicio");

      if (error) throw error;
      setAgendamentos(data || []);

      // Buscar serviços
      const { data: servicosData } = await supabase
        .from("servicos")
        .select("*")
        .eq("barbearia_id", barbeariaId)
        .order("nome");
      setServicos(servicosData || []);

      // Buscar barbeiros
      const { data: barbeirosData } = await supabase
        .from("barbeiros")
        .select("*")
        .eq("barbearia_id", barbeariaId)
        .order("nome");
      setBarbeiros(barbeirosData || []);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const fetchAgendamentosPorBarbeiro = async (barbeiroId: string) => {
    if (!barbeariaId) return [];

    try {
      const { data, error } = await supabase
        .from("agendamentos")
        .select(`
          *,
          profiles (nome),
          servicos (nome, duracao_min)
        `)
        .eq("barbeiro_id", barbeiroId)
        .gte("data_inicio", new Date().toISOString())
        .order("data_inicio");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      return [];
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
            <h1 className="text-xl font-bold">{barbeariaInfo?.nome || "Minha Barbearia"}</h1>
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
        <Tabs defaultValue="agendamentos" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
            <TabsTrigger value="servicos">Serviços</TabsTrigger>
            <TabsTrigger value="barbeiros">Barbeiros</TabsTrigger>
          </TabsList>

          <TabsContent value="agendamentos" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Agendamentos</h2>
                <p className="text-muted-foreground">Horários marcados</p>
              </div>
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
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Cliente:</span>
                      <span>{agendamento.profiles?.nome || "Cliente não disponível"}</span>
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
                  <p className="text-muted-foreground">Nenhum agendamento futuro</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="servicos" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Serviços</h2>
                <p className="text-muted-foreground">Gerencie seus serviços</p>
              </div>
              <Button onClick={() => setServicoDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Serviço
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {servicos.map((servico) => (
                <Card key={servico.id}>
                  <CardHeader>
                    <CardTitle>{servico.nome}</CardTitle>
                    <CardDescription>
                      R$ {(servico.preco_centavos / 100).toFixed(2)} • {servico.duracao_min} min
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className={`text-xs px-2 py-1 rounded ${servico.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {servico.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {servicos.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Scissors className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum serviço cadastrado</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="barbeiros" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Barbeiros</h2>
                <p className="text-muted-foreground">Gerencie sua equipe e horários</p>
              </div>
              <Button onClick={() => setBarbeiroDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Barbeiro
              </Button>
            </div>

            <div className="grid gap-4">
              {barbeiros.map((barbeiro) => (
                <BarbeiroCard
                  key={barbeiro.id}
                  barbeiro={barbeiro}
                  onViewSchedule={async (id) => {
                    setSelectedBarbeiroId(id);
                    const agendamentosData = await fetchAgendamentosPorBarbeiro(id);
                    // Store in state if needed
                  }}
                />
              ))}
            </div>

            {barbeiros.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum barbeiro cadastrado</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <ServicoDialog
        open={servicoDialogOpen}
        onOpenChange={setServicoDialogOpen}
        barbeariaId={barbeariaId || ""}
        onSuccess={fetchData}
      />

      <BarbeiroDialog
        open={barbeiroDialogOpen}
        onOpenChange={setBarbeiroDialogOpen}
        barbeariaId={barbeariaId || ""}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default BarbeariaDashboard;
