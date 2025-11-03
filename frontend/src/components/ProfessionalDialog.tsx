import { useEffect, useState } from "react";
import { Professional, professionalsAPI } from "@/api/professionals";
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

interface ProfessionalDialogProps extends DialogProps {
  businessId: string;
  onSuccess: () => void;
  professional?: Professional | null;
}

interface ProfessionalFormData {
  name: string;
  specialties: string;
  active: boolean;
}

const INITIAL_FORM_STATE: ProfessionalFormData = {
  name: "",
  specialties: "",
  active: true,
};

export function ProfessionalDialog({
  open,
  onOpenChange,
  businessId,
  onSuccess,
  professional,
}: ProfessionalDialogProps) {
  const [formData, setFormData] = useState<ProfessionalFormData>(INITIAL_FORM_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = Boolean(professional);

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
      toast.error("Por favor, digite o nome do professional");
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

      if (isEditMode && professional) {
        await professionalsAPI.update(professional.id, payload);
        toast.success("Professional atualizado com sucesso!");
      } else {
        const businessIdNum = parseInt(businessId, 10);
        await professionalsAPI.create({
          businessId: businessIdNum,
          ...payload,
        });
        toast.success("Professional criado com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          isEditMode ? "Error updating professional:" : "Error creating professional:",
          error
        );
      }
      toast.error(
        isEditMode ? "Erro ao atualizar professional" : "Erro ao criar professional"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
  };

  useEffect(() => {
    if (open && isEditMode && professional) {
      setFormData({
        name: professional.name ?? "",
        specialties: Array.isArray(professional.specialties)
          ? professional.specialties.join(", ")
          : "",
        active: professional.active ?? true,
      });
    }
    if (!open) {
      resetForm();
    }
  }, [open, isEditMode, professional]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Professional" : "Novo Professional"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Atualize as informações do professional abaixo"
              : "Registre um novo professional para sua business"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Professional *</Label>
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
                Ativar ou desativar este professional
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

export default ProfessionalDialog;
