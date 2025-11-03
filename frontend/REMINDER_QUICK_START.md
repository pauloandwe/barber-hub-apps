# Quick Start Guide: Creating Reminder Configuration Pages

This guide provides a step-by-step template for creating reminder configuration pages following Professional Hub's established patterns.

## Step 1: Create API Module

**File**: `src/api/reminders.ts`

```typescript
import { apiClient } from "./client";

export interface ReminderConfig {
  id: number;
  businessId: number;
  type: "sms" | "whatsapp" | "email";
  triggerTime: number; // minutes before appointment
  template?: string;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReminderRequest {
  businessId: number;
  type: "sms" | "whatsapp" | "email";
  triggerTime: number;
  template?: string;
  enabled?: boolean;
}

export interface UpdateReminderRequest {
  type?: "sms" | "whatsapp" | "email";
  triggerTime?: number;
  template?: string;
  enabled?: boolean;
}

export const remindersAPI = {
  async getAll(businessId: number): Promise<ReminderConfig[]> {
    const response = await apiClient.get(`/reminders?businessId=${businessId}`);
    return response?.data?.data?.data || response?.data?.data || [];
  },

  async getById(id: number): Promise<ReminderConfig> {
    const response = await apiClient.get(`/reminders/${id}`);
    return response?.data?.data;
  },

  async create(data: CreateReminderRequest): Promise<ReminderConfig> {
    const response = await apiClient.post("/reminders", data);
    return response?.data?.data;
  },

  async update(id: number, data: UpdateReminderRequest): Promise<ReminderConfig> {
    const response = await apiClient.put(`/reminders/${id}`, data);
    return response?.data?.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/reminders/${id}`);
  },
};
```

## Step 2: Export from API Index

**File**: `src/api/index.ts` - Add these lines:

```typescript
export { remindersAPI } from './reminders';
export type { ReminderConfig, CreateReminderRequest, UpdateReminderRequest } from './reminders';
```

## Step 3: Create Dialog Component

**File**: `src/components/ReminderDialog.tsx`

```typescript
import { useEffect, useState } from "react";
import { ReminderConfig, remindersAPI } from "@/api/reminders";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { DialogProps } from "@/types/shared.types";

interface ReminderDialogProps extends DialogProps {
  businessId: string;
  onSuccess: () => void;
  reminder?: ReminderConfig | null;
}

interface ReminderFormData {
  type: "sms" | "whatsapp" | "email";
  triggerTime: string;
  template: string;
  enabled: boolean;
}

const INITIAL_FORM_STATE: ReminderFormData = {
  type: "sms",
  triggerTime: "15",
  template: "",
  enabled: true,
};

export function ReminderDialog({
  open,
  onOpenChange,
  businessId,
  onSuccess,
  reminder,
}: ReminderDialogProps) {
  const [formData, setFormData] = useState<ReminderFormData>(INITIAL_FORM_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = Boolean(reminder);

  useEffect(() => {
    if (open) {
      if (reminder) {
        setFormData({
          type: reminder.type,
          triggerTime: reminder.triggerTime.toString(),
          template: reminder.template || "",
          enabled: reminder.enabled,
        });
      } else {
        setFormData(INITIAL_FORM_STATE);
      }
    }
  }, [reminder, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: value as "sms" | "whatsapp" | "email",
    }));
  };

  const validateForm = (): boolean => {
    const triggerTime = parseInt(formData.triggerTime, 10);
    
    if (isNaN(triggerTime) || triggerTime < 0) {
      toast.error("Tempo de disparo deve ser um número válido maior ou igual a 0");
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
        businessId: parseInt(businessId, 10),
        type: formData.type,
        triggerTime: parseInt(formData.triggerTime, 10),
        template: formData.template || undefined,
        enabled: formData.enabled,
      };

      if (isEditMode && reminder) {
        await remindersAPI.update(reminder.id, {
          type: payload.type,
          triggerTime: payload.triggerTime,
          template: payload.template,
          enabled: payload.enabled,
        });
        toast.success("Lembrete atualizado com sucesso!");
      } else {
        await remindersAPI.create(payload);
        toast.success("Lembrete criado com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar lembrete:", error);
      toast.error("Erro ao salvar lembrete");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar" : "Criar"} Lembrete</DialogTitle>
          <DialogDescription>
            Configure como e quando o lembrete deve ser enviado
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Canal de Comunicação</Label>
            <Select value={formData.type} onValueChange={handleSelectChange}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="triggerTime">
              Minutos Antes da Consulta
            </Label>
            <Input
              id="triggerTime"
              name="triggerTime"
              type="number"
              min="0"
              value={formData.triggerTime}
              onChange={handleInputChange}
              placeholder="15"
            />
            <p className="text-xs text-muted-foreground">
              O lembrete será enviado este número de minutos antes da consulta
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Template (Opcional)</Label>
            <Input
              id="template"
              name="template"
              value={formData.template}
              onChange={handleInputChange}
              placeholder="Seu template de mensagem personalizado"
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para usar o template padrão
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enabled"
              name="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, enabled: checked as boolean }))
              }
            />
            <Label htmlFor="enabled" className="font-normal">
              Ativar este lembrete
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
              {isEditMode ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

## Step 4: Create Page Component

**File**: `src/pages/ReminderConfig.tsx`

```typescript
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { remindersAPI, ReminderConfig } from "@/api/reminders";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, LogOut, Bell, Trash2, Edit2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { ReminderDialog } from "@/components/ReminderDialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { AuthGuard } from "@/components/AuthGuard";
import { ROUTES } from "@/constants/routes";
import { UserRole } from "@/constants/roles";

const REMINDER_TYPE_LABELS: Record<string, string> = {
  sms: "SMS",
  whatsapp: "WhatsApp",
  email: "Email",
};

export function ReminderConfig() {
  const navigate = useNavigate();
  const { barbershopId, isLoading: roleLoading } = useUserRole();
  const [reminders, setReminders] = useState<ReminderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<ReminderConfig | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (roleLoading) return;

    if (!barbershopId) {
      toast.error("Não foi possível identificar sua business");
      setIsLoading(false);
      return;
    }

    fetchReminders();
  }, [barbershopId, roleLoading]);

  const fetchReminders = async () => {
    try {
      setIsLoading(true);
      const barbershopIdNum = parseInt(barbershopId!, 10);
      const data = await remindersAPI.getAll(barbershopIdNum);
      setReminders(data);
    } catch (error) {
      console.error("Erro ao carregar lembretes:", error);
      toast.error("Erro ao carregar lembretes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReminder = () => {
    setSelectedReminder(null);
    setIsDialogOpen(true);
  };

  const handleEditReminder = (reminder: ReminderConfig) => {
    setSelectedReminder(reminder);
    setIsDialogOpen(true);
  };

  const handleDeleteReminder = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este lembrete?")) {
      return;
    }

    setIsDeletingId(id);
    try {
      await remindersAPI.delete(id);
      toast.success("Lembrete deletado com sucesso!");
      fetchReminders();
    } catch (error) {
      console.error("Erro ao deletar lembrete:", error);
      toast.error("Erro ao deletar lembrete");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleLogout = () => {
    // Implement logout logic
    navigate(ROUTES.LOGIN);
  };

  if (isLoading) return <LoadingSpinner fullPage />;

  return (
    <AuthGuard requiredRole={UserRole.BARBERSHOP_MANAGER}>
      <div className="min-h-screen gradient-subtle">
        <header className="border-b bg-card">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Configurar Lembretes</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </header>

        <main className="container mx-auto p-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">Lembretes de Consultas</h2>
            <p className="text-muted-foreground mt-2">
              Configure quando e como notificar seus clientes sobre suas consultas
            </p>
          </div>

          <div className="mb-6">
            <Button onClick={handleAddReminder} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Lembrete
            </Button>
          </div>

          {reminders.length === 0 ? (
            <EmptyState
              icon={<Bell className="h-16 w-16" />}
              title="Nenhum lembrete configurado"
              description="Configure lembretes para notificar seus clientes automaticamente sobre suas consultas"
              action={
                <Button onClick={handleAddReminder}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Lembrete
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4">
              {reminders.map((reminder) => (
                <Card key={reminder.id} className="shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {REMINDER_TYPE_LABELS[reminder.type]}
                          <Badge variant={reminder.enabled ? "default" : "secondary"}>
                            {reminder.enabled ? "Ativo" : "Inativo"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Enviado {reminder.triggerTime} minutos antes da consulta
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditReminder(reminder)}
                          disabled={isDeletingId !== null}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteReminder(reminder.id)}
                          disabled={isDeletingId === reminder.id}
                          className="text-destructive hover:text-destructive"
                        >
                          {isDeletingId === reminder.id ? (
                            <span className="animate-spin">⏳</span>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {reminder.template && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        <strong>Template:</strong> {reminder.template}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </main>

        <ReminderDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          businessId={barbershopId || ""}
          onSuccess={fetchReminders}
          reminder={selectedReminder}
        />
      </div>
    </AuthGuard>
  );
}

export default ReminderConfig;
```

## Step 5: Add Route

**File**: `src/App.tsx` - Add this route inside the Routes component:

```typescript
import ReminderConfig from "./pages/ReminderConfig";

// Inside Routes:
<Route
  path="/reminders"
  element={
    <AuthGuard requiredRole={UserRole.BARBERSHOP_MANAGER}>
      <ReminderConfig />
    </AuthGuard>
  }
/>
```

## Step 6: Add Route Constant

**File**: `src/constants/routes.ts` - Add to ROUTES object:

```typescript
export const ROUTES = {
  // ... existing routes
  REMINDERS: "/reminders",
} as const;

export const PROTECTED_ROUTES = [
  // ... existing routes
  ROUTES.REMINDERS,
];
```

## Step 7: Add Navigation Links (Optional)

Update navigation/menu to include link to reminder config page:

```typescript
<Button
  variant="ghost"
  onClick={() => navigate(ROUTES.REMINDERS)}
  className="w-full justify-start"
>
  <Bell className="mr-2 h-4 w-4" />
  Lembretes
</Button>
```

## Testing Checklist

- [ ] API module successfully imports and calls backend
- [ ] Page loads with loading spinner initially
- [ ] Shows empty state when no reminders exist
- [ ] Can create new reminder via dialog
- [ ] Can edit existing reminder
- [ ] Can delete reminder with confirmation
- [ ] Toast notifications show success/error messages
- [ ] Authorization guard prevents non-BARBERSHOP_MANAGER access
- [ ] Reminder type badge shows correct color coding
- [ ] Form validation prevents invalid inputs
- [ ] Loading states prevent double-submission

## Key Patterns Used

1. **API Module Pattern**: Separate API logic from components
2. **Dialog Pattern**: Reusable create/edit component
3. **Page Pattern**: Full page with header, main content, actions
4. **State Management**: Local useState for UI state, API calls for data
5. **Error Handling**: Try/catch with toast notifications
6. **Loading States**: Disable buttons, show spinners during async operations
7. **Styling**: Tailwind utility classes + shadcn/ui components
8. **TypeScript**: Full type safety with interfaces
9. **RBAC**: AuthGuard with role requirements
10. **Accessibility**: Proper labels, semantic HTML, keyboard navigation

## Customization Tips

- Change form fields based on your reminder configuration needs
- Adjust the API endpoint paths to match your backend
- Modify the ReminderConfig interface to include any additional fields
- Customize the REMINDER_TYPE_LABELS mapping
- Adjust styling classes to match your design system
- Add additional validation based on business logic

