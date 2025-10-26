import { useState } from "react";
import { authAPI } from "@/api/auth";
import { servicesAPI } from "@/api/services";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ServicoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barbeariaId: string;
  onSuccess: () => void;
}

export const ServicoDialog = ({ open, onOpenChange, barbeariaId, onSuccess }: ServicoDialogProps) => {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !preco || !duracao) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const barbeariaIdNum = parseInt(barbeariaId);
      await servicesAPI.create({
        businessId: barbeariaIdNum,
        nome,
        descricao: undefined,
        duracao: parseInt(duracao),
        preco: parseFloat(preco),
        ativo: true,
      });

      toast.success("Serviço cadastrado com sucesso!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao cadastrar serviço:", error);
      toast.error("Erro ao cadastrar serviço");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNome("");
    setPreco("");
    setDuracao("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Serviço</DialogTitle>
          <DialogDescription>Cadastre um novo serviço para sua barbearia</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Serviço *</Label>
            <Input
              id="nome"
              placeholder="Ex: Corte de Cabelo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preco">Preço (R$) *</Label>
            <Input
              id="preco"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex: 30.00"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duracao">Duração (minutos) *</Label>
            <Input
              id="duracao"
              type="number"
              min="5"
              step="5"
              placeholder="Ex: 30"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
