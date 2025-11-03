import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReminderTemplate, ReminderType } from "@/api/reminders";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ReminderTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ReminderTemplate | null;
  onSave: (data: any) => Promise<void>;
}

const REMINDER_TYPES = [
  { value: ReminderType.CONFIRMATION, label: "Confirmação de Agendamento" },
  { value: ReminderType.PRE_APPOINTMENT, label: "Lembrete Pré-Agendamento" },
  { value: ReminderType.POST_APPOINTMENT, label: "Acompanhamento Pós-Agendamento" },
  { value: ReminderType.RESCHEDULING, label: "Lembrete de Reagendamento" },
];

const AVAILABLE_VARIABLES = [
  { key: "clientName", label: "Nome do Cliente" },
  { key: "appointmentDate", label: "Data do Agendamento" },
  { key: "appointmentTime", label: "Horário do Agendamento" },
  { key: "professionalName", label: "Nome do Professional" },
  { key: "serviceName", label: "Nome do Serviço" },
];

const DEFAULT_TEMPLATES: Record<string, string> = {
  [ReminderType.CONFIRMATION]:
    "Olá {clientName}! Confirmamos seu agendamento para {appointmentDate} às {appointmentTime} com {professionalName}. Até lá! ✂️",
  [ReminderType.PRE_APPOINTMENT]:
    "Oi {clientName}! Lembrete: seu horário é {appointmentDate} às {appointmentTime} com {professionalName}. Confirme respondendo SIM.",
  [ReminderType.POST_APPOINTMENT]:
    "E aí {clientName}! Gostou do atendimento? Avalie-nos e agende seu próximo horário! 🌟",
  [ReminderType.RESCHEDULING]:
    "Sentimos sua falta, {clientName}! Que tal agendar um novo horário? Responda para marcar.",
};

export function ReminderTemplateDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
}: ReminderTemplateDialogProps) {
  const [formData, setFormData] = useState({
    type: ReminderType.CONFIRMATION,
    message: DEFAULT_TEMPLATES[ReminderType.CONFIRMATION],
    active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type,
        message: initialData.message,
        active: initialData.active,
      });
    } else {
      setFormData({
        type: ReminderType.CONFIRMATION,
        message: DEFAULT_TEMPLATES[ReminderType.CONFIRMATION],
        active: true,
      });
    }
  }, [initialData, open]);

  useEffect(() => {
    setCharacterCount(formData.message.length);
  }, [formData.message]);

  const handleTypeChange = (type: string) => {
    setFormData({
      ...formData,
      type: type as ReminderType,
      message: DEFAULT_TEMPLATES[type as ReminderType],
    });
  };

  const handleMessageChange = (message: string) => {
    setFormData({ ...formData, message });
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById("message") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage =
        formData.message.substring(0, start) +
        `{${variable}}` +
        formData.message.substring(end);
      handleMessageChange(newMessage);
    }
  };

  const handleSubmit = async () => {
    if (!formData.message.trim()) {
      alert("A mensagem não pode estar vazia");
      return;
    }

    try {
      setIsLoading(true);
      await onSave({
        type: formData.type,
        message: formData.message,
        active: formData.active,
      });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Template" : "Novo Template de Mensagem"}
          </DialogTitle>
          <DialogDescription>
            Customize as mensagens de lembrete com variáveis dinâmicas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Reminder Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Lembrete</Label>
            <Select
              value={formData.type}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Mensagem</Label>
              <span className="text-xs text-gray-500">
                {characterCount} caracteres
              </span>
            </div>
            <Textarea
              id="message"
              placeholder="Digite a mensagem do lembrete..."
              value={formData.message}
              onChange={(e) => handleMessageChange(e.target.value)}
              className="min-h-24 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              Máximo de 500 caracteres (WhatsApp suporta até 4096)
            </p>
          </div>

          {/* Variables */}
          <div className="space-y-3">
            <Label>Variáveis Disponíveis</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_VARIABLES.map((variable) => (
                <Button
                  key={variable.key}
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable(variable.key)}
                  className="gap-2"
                  type="button"
                >
                  <span className="font-mono text-xs">{"{" + variable.key + "}"}</span>
                  <span className="text-xs">({variable.label})</span>
                </Button>
              ))}
            </div>
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-xs text-blue-900">
                <strong>Dica:</strong> Clique em uma variável para inserir no template, ou use{" "}
                <span className="font-mono bg-blue-100 px-1 rounded">{"{variavel}"}</span> manualmente
              </p>
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <Label>Preview (Exemplo)</Label>
            <div className="rounded-lg bg-gray-50 p-4 text-sm">
              {formData.message
                .replace("{clientName}", "João Silva")
                .replace("{appointmentDate}", "15/12/2024")
                .replace("{appointmentTime}", "10:30")
                .replace("{professionalName}", "Carlos")
                .replace("{serviceName}", "Corte e Barba")}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, active: checked as boolean })
              }
            />
            <Label htmlFor="active" className="cursor-pointer font-normal">
              Template ativo
            </Label>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {initialData ? "Atualizar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
