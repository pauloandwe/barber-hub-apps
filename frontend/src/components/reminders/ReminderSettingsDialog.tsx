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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReminderSettings, ReminderType } from "@/api/reminders";
import { X, Plus, Loader2 } from "lucide-react";

interface ReminderSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ReminderSettings | null;
  onSave: (data: any) => Promise<void>;
}

const REMINDER_TYPES = [
  { value: ReminderType.CONFIRMATION, label: "Confirmação de Agendamento" },
  { value: ReminderType.PRE_APPOINTMENT, label: "Lembrete Pré-Agendamento" },
  {
    value: ReminderType.POST_APPOINTMENT,
    label: "Acompanhamento Pós-Agendamento",
  },
  { value: ReminderType.RESCHEDULING, label: "Lembrete de Reagendamento" },
];

const TIMEZONES = [
  "America/Sao_Paulo",
  "America/Araguaina",
  "America/Maceio",
  "America/Bahia",
  "America/Fortaleza",
  "America/Recife",
  "America/Rio_Branco",
  "America/Manaus",
  "America/Anchorage",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
];

export function ReminderSettingsDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
}: ReminderSettingsDialogProps) {
  const [formData, setFormData] = useState({
    type: ReminderType.CONFIRMATION,
    timezone: "America/Sao_Paulo",
    hoursBeforeAppointment: [24],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [newHour, setNewHour] = useState<number | "">("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type,
        timezone: initialData.timezone,
        hoursBeforeAppointment: initialData.hoursBeforeAppointment,
      });
    } else {
      setFormData({
        type: ReminderType.CONFIRMATION,
        timezone: "America/Sao_Paulo",
        hoursBeforeAppointment: [24],
      });
    }
    setNewHour("");
  }, [initialData, open]);

  const handleAddHour = () => {
    if (newHour === "" || newHour < 0 || newHour > 720) {
      alert("Por favor, insira um valor entre 0 e 720 horas");
      return;
    }

    const hours = [
      ...new Set([...formData.hoursBeforeAppointment, newHour]),
    ].sort((a, b) => a - b);
    setFormData({ ...formData, hoursBeforeAppointment: hours });
    setNewHour("");
  };

  const handleRemoveHour = (hour: number) => {
    setFormData({
      ...formData,
      hoursBeforeAppointment: formData.hoursBeforeAppointment.filter(
        (h) => h !== hour
      ),
    });
  };

  const handleSubmit = async () => {
    if (formData.hoursBeforeAppointment.length === 0) {
      alert("Adicione pelo menos uma hora para envio de lembretes");
      return;
    }

    try {
      setIsLoading(true);
      await onSave({
        type: formData.type,
        enabled: true,
        hoursBeforeAppointment: formData.hoursBeforeAppointment,
        timezone: formData.timezone,
      });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData
              ? "Editar Configuração"
              : "Nova Configuração de Lembrete"}
          </DialogTitle>
          <DialogDescription>
            Configure os parâmetros para envio automático de lembretes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Lembrete</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as ReminderType })
              }
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

          {}
          <div className="space-y-2">
            <Label htmlFor="timezone">Fuso Horário</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) =>
                setFormData({ ...formData, timezone: value })
              }
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {}
          <div className="space-y-3">
            <Label>Horas Antes do Agendamento</Label>

            {formData.hoursBeforeAppointment.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.hoursBeforeAppointment.map((hour) => (
                  <div
                    key={hour}
                    className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1.5"
                  >
                    <span className="text-sm font-medium text-blue-700">
                      {hour}h
                    </span>
                    <button
                      onClick={() => handleRemoveHour(hour)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                max="720"
                placeholder="Ex: 24 (24 horas antes)"
                value={newHour}
                onChange={(e) =>
                  setNewHour(
                    e.target.value === "" ? "" : parseInt(e.target.value, 10)
                  )
                }
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddHour();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddHour}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>

            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-600">
                <strong>Exemplos comuns:</strong>
              </p>
              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                <li>
                  • <strong>2</strong> = 2 horas antes
                </li>
                <li>
                  • <strong>24</strong> = 1 dia antes
                </li>
                <li>
                  • <strong>48</strong> = 2 dias antes
                </li>
              </ul>
            </div>
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
          <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {initialData ? "Atualizar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
