import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

interface Barbeiro {
  id: string;
  nome: string;
  bio: string | null;
  ativo: boolean;
}

interface Agendamento {
  id: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  profiles: { nome: string };
  servicos: { nome: string; duracao_min: number };
}

interface BarbeiroCardProps {
  barbeiro: Barbeiro;
  onViewSchedule?: (barbeiroId: string) => void;
}

export const BarbeiroCard = ({ barbeiro }: BarbeiroCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAgendamentos();
    }
  }, [isOpen]);

  const fetchAgendamentos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("agendamentos")
        .select(`
          *,
          profiles (nome),
          servicos (nome, duracao_min)
        `)
        .eq("barbeiro_id", barbeiro.id)
        .gte("data_inicio", new Date().toISOString())
        .order("data_inicio")
        .limit(10);

      if (error) throw error;
      setAgendamentos(data || []);
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
                {barbeiro.nome}
              </CardTitle>
              {barbeiro.bio && <CardDescription>{barbeiro.bio}</CardDescription>}
            </div>
            <div className="flex gap-2">
              <span className={`text-xs px-2 py-1 rounded ${barbeiro.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                {barbeiro.ativo ? "Ativo" : "Inativo"}
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
            ) : agendamentos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum horário agendado
              </p>
            ) : (
              <div className="space-y-3">
                {agendamentos.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(agendamento.data_inicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {agendamento.servicos?.nome || "Serviço não disponível"} • {agendamento.servicos?.duracao_min || 0} min
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cliente: {agendamento.profiles?.nome || "Cliente não disponível"}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(agendamento.status)}`}>
                        {agendamento.status}
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
