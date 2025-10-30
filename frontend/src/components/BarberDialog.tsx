import { useEffect, useState } from "react";
import { Barber, barbersAPI } from "@/api/barbers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { DialogProps } from "@/types/shared.types";

interface BarberDialogProps extends DialogProps {
  barbershopId: string;
  onSuccess: () => void;
  barber?: Barber | null;
}

interface BarberFormData {
  name: string;
  specialties: string;
  active: boolean;
}

const INITIAL_FORM_STATE: BarberFormData = {
  name: "",
  specialties: "",
  active: true,
};

export function BarberDialog({
  open,
  onOpenChange,
  barbershopId,
  onSuccess,
  barber,
}: BarberDialogProps) {
  const [formData, setFormData] = useState<BarberFormData>(INITIAL_FORM_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = Boolean(barber);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const specialtiesToArray = () => {
    if (!formData.specialties.trim()) {
      return [];
    }

    return formData.specialties
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const validateForm = (): boolean => {
    if (!formData.name || formData.name.trim().length === 0) {
      toast.error("Por favor, digite o nome do barbeiro");
      return false;
    }

    if (formData.name.trim().length < 3) {
      toast.error("O nome deve ter pelo menos 3 caracteres");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        specialties: specialtiesToArray(),
        active: formData.active,
      };

      if (isEditMode && barber) {
        await barbersAPI.update(barber.id, payload);
        toast.success("Barbeiro atualizado com sucesso!");
      } else {
        const barbershopIdNum = parseInt(barbershopId, 10);
        await barbersAPI.create({
          businessId: barbershopIdNum,
          ...payload,
        });
        toast.success("Barbeiro criado com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          isEditMode ? "Error updating barber:" : "Error creating barber:",
          error
        );
      }
      toast.error(
        isEditMode ? "Erro ao atualizar barbeiro" : "Erro ao criar barbeiro"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
  };

  useEffect(() => {
    if (open && isEditMode && barber) {
      setFormData({
        name: barber.name ?? "",
        specialties: Array.isArray(barber.specialties)
          ? barber.specialties.join(", ")
          : "",
        active: barber.active ?? true,
      });
    }
    if (!open) {
      resetForm();
    }
  }, [open, isEditMode, barber]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Barbeiro" : "Novo Barbeiro"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Atualize as informações do barbeiro abaixo"
              : "Registre um novo barbeiro para sua barbearia"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Barbeiro *</Label>
            <Input
              id="name"
              type="text"
              name="name"
              placeholder="Ex: João Silva"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialties">Especialidades (opcional)</Label>
            <Textarea
              id="specialties"
              name="specialties"
              placeholder="Separe cada especialidade com uma vírgula"
              value={formData.specialties}
              onChange={handleInputChange}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between rounded border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="active">Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Ativar ou desativar este barbeiro
              </p>
            </div>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, active: checked }))
              }
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Salvar mudanças" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default BarberDialog;
