import { useState } from "react";
import { authAPI } from "@/api/auth";
import { barbersAPI } from "@/api/barbers";
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
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      toast.error("Preencha o nome do barbeiro");
      return;
    }

    setLoading(true);
    try {
      const barbeariaIdNum = parseInt(barbeariaId);
      await barbersAPI.create({
        businessId: barbeariaIdNum,
        name,
        specialties: [],
        active: true,
      });

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
    setName("");
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
            <Label htmlFor="name">Nome do Barbeiro *</Label>
            <Input
              id="name"
              placeholder="Ex: João Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
