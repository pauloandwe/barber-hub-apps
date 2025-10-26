import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BarbeiroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barbeariaId: string;
  onSuccess: () => void;
}

export const BarbeiroDialog = ({ open, onOpenChange, barbeariaId, onSuccess }: BarbeiroDialogProps) => {
  const [nome, setNome] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome) {
      toast.error("Preencha o nome do barbeiro");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("barbeiros").insert({
        nome,
        bio: bio || null,
        barbearia_id: barbeariaId,
        ativo: true,
      });

      if (error) throw error;

      toast.success("Barbeiro cadastrado com sucesso!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao cadastrar barbeiro:", error);
      toast.error("Erro ao cadastrar barbeiro");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNome("");
    setBio("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Barbeiro</DialogTitle>
          <DialogDescription>Cadastre um novo barbeiro para sua barbearia</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Barbeiro *</Label>
            <Input
              id="nome"
              placeholder="Ex: João Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (opcional)</Label>
            <Textarea
              id="bio"
              placeholder="Breve descrição sobre o barbeiro..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
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
