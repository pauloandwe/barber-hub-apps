import { useState, useEffect } from "react";
import { authAPI } from "@/api/auth";
import { servicesAPI } from "@/api/services";
import { barbersAPI } from "@/api/barbers";
import { appointmentsAPI } from "@/api/appointments";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { format, addMinutes, startOfDay, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface Servico {
  id: string;
  nome: string;
  duracao_min: number;
  preco_centavos: number;
}

interface Barbeiro {
  id: string;
  nome: string;
}

interface AgendamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barbeariaId: string;
  onSuccess: () => void;
}

export const AgendamentoDialog = ({ open, onOpenChange, barbeariaId, onSuccess }: AgendamentoDialogProps) => {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [selectedServico, setSelectedServico] = useState<string>("");
  const [selectedBarbeiro, setSelectedBarbeiro] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [observacoes, setObservacoes] = useState("");
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(false);

  useEffect(() => {
    if (open && barbeariaId) {
      fetchServicos();
      fetchBarbeiros();
    }
  }, [open, barbeariaId]);

  useEffect(() => {
    if (selectedBarbeiro && selectedDate && selectedServico) {
      fetchHorariosDisponiveis();
    }
  }, [selectedBarbeiro, selectedDate, selectedServico]);

  const fetchServicos = async () => {
    try {
      const barbeariaIdNum = parseInt(barbeariaId);
      const services = await servicesAPI.getAll(barbeariaIdNum);
      setServicos(
        services.map((s) => ({
          id: s.id.toString(),
          nome: s.nome,
          duracao_min: s.duracao,
          preco_centavos: Math.round(s.preco * 100),
        }))
      );
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
      toast.error("Erro ao carregar serviços");
    }
  };

  const fetchBarbeiros = async () => {
    try {
      const barbeariaIdNum = parseInt(barbeariaId);
      const barbers = await barbersAPI.getAll(barbeariaIdNum);
      setBarbeiros(
        barbers.map((b) => ({
          id: b.id.toString(),
          nome: b.nome,
        }))
      );
    } catch (error) {
      console.error("Erro ao buscar barbeiros:", error);
      toast.error("Erro ao carregar barbeiros");
    }
  };

  const fetchHorariosDisponiveis = async () => {
    if (!selectedDate || !selectedBarbeiro || !selectedServico) return;

    setLoadingHorarios(true);
    try {
      const servico = servicos.find(s => s.id === selectedServico);
      if (!servico) return;

      const startOfSelectedDay = startOfDay(selectedDate);
      const endOfSelectedDay = new Date(startOfSelectedDay);
      endOfSelectedDay.setHours(23, 59, 59, 999);

      // TODO: Buscar agendamentos e bloqueios via API
      // const { barbeariaIdNum } = parseInt(barbeariaId);
      // const agendamentos = await appointmentsAPI.getAll(barbeariaIdNum);
      // const bloqueios = await bloqueiosAPI.getAll(...);
      const agendamentos = [];
      const bloqueios = [];

      // Gerar horários disponíveis (8h às 18h, a cada 30 minutos)
      const horarios: string[] = [];
      let currentTime = setHours(setMinutes(startOfSelectedDay, 0), 8);
      const endTime = setHours(setMinutes(startOfSelectedDay, 0), 18);
      const now = new Date();

      while (currentTime < endTime) {
        const horaFormatada = format(currentTime, "HH:mm");
        const fimAgendamento = addMinutes(currentTime, servico.duracao_min);

        // Verificar se o horário já passou (para data de hoje)
        const isPastTime = selectedDate.toDateString() === now.toDateString() && currentTime <= now;

        // Verificar se o horário está disponível
        const isOccupied = agendamentos?.some(ag => {
          const agInicio = new Date(ag.data_inicio);
          const agFim = new Date(ag.data_fim);
          return (
            (currentTime >= agInicio && currentTime < agFim) ||
            (fimAgendamento > agInicio && fimAgendamento <= agFim) ||
            (currentTime <= agInicio && fimAgendamento >= agFim)
          );
        });

        const isBlocked = bloqueios?.some(bl => {
          const blInicio = new Date(bl.data_inicio);
          const blFim = new Date(bl.data_fim);
          return currentTime >= blInicio && currentTime < blFim;
        });

        if (!isOccupied && !isBlocked && !isPastTime) {
          horarios.push(horaFormatada);
        }

        currentTime = addMinutes(currentTime, 30);
      }

      setHorariosDisponiveis(horarios);
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
      toast.error("Erro ao carregar horários disponíveis");
    } finally {
      setLoadingHorarios(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedServico || !selectedBarbeiro || !selectedDate || !selectedTime) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const user = authAPI.getStoredUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const servico = servicos.find((s) => s.id === selectedServico);
      if (!servico) return;

      const [hours, minutes] = selectedTime.split(":").map(Number);
      const dataInicio = setHours(setMinutes(selectedDate, minutes), hours);
      const dataFim = addMinutes(dataInicio, servico.duracao_min);
      const barbeariaIdNum = parseInt(barbeariaId);

      await appointmentsAPI.create(barbeariaIdNum, {
        barberId: parseInt(selectedBarbeiro),
        clienteId: user.id,
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        observacoes: observacoes || undefined,
        status: "pendente",
        origem: "web",
      });

      toast.success("Agendamento realizado com sucesso!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      toast.error("Erro ao criar agendamento");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedServico("");
    setSelectedBarbeiro("");
    setSelectedDate(undefined);
    setSelectedTime("");
    setObservacoes("");
    setHorariosDisponiveis([]);
  };

  const selectedServicoData = servicos.find(s => s.id === selectedServico);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>Preencha os dados para agendar seu horário</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="servico">Serviço *</Label>
            <Select value={selectedServico} onValueChange={setSelectedServico}>
              <SelectTrigger id="servico">
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {servicos.map((servico) => (
                  <SelectItem key={servico.id} value={servico.id}>
                    {servico.nome} - R$ {(servico.preco_centavos / 100).toFixed(2)} ({servico.duracao_min} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="barbeiro">Barbeiro *</Label>
            <Select value={selectedBarbeiro} onValueChange={setSelectedBarbeiro}>
              <SelectTrigger id="barbeiro">
                <SelectValue placeholder="Selecione um barbeiro" />
              </SelectTrigger>
              <SelectContent>
                {barbeiros.map((barbeiro) => (
                  <SelectItem key={barbeiro.id} value={barbeiro.id}>
                    {barbeiro.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data *</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              locale={ptBR}
              className="rounded-md border"
            />
          </div>

          {selectedDate && selectedBarbeiro && selectedServico && (
            <div className="space-y-2">
              <Label htmlFor="horario">Horário *</Label>
              {loadingHorarios ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : horariosDisponiveis.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum horário disponível para esta data</p>
              ) : (
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger id="horario">
                    <SelectValue placeholder="Selecione um horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {horariosDisponiveis.map((horario) => (
                      <SelectItem key={horario} value={horario}>
                        {horario}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Alguma observação adicional?"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          {selectedServicoData && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium">Resumo do Agendamento</p>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p><span className="font-medium">Serviço:</span> {selectedServicoData.nome}</p>
                <p><span className="font-medium">Duração:</span> {selectedServicoData.duracao_min} minutos</p>
                <p><span className="font-medium">Valor:</span> R$ {(selectedServicoData.preco_centavos / 100).toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedServico || !selectedBarbeiro || !selectedDate || !selectedTime}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Agendamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
