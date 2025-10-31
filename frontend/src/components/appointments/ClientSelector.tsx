import { useEffect, useMemo, useState, ChangeEvent } from "react";
import { appointmentsAPI, Appointment } from "@/api/appointments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Loader2, Plus, User, XCircle } from "lucide-react";

export type ClientSelection =
  | {
      type: "existing";
      clientId?: number | null;
      clientContactId?: number | null;
      name?: string | null;
      phone?: string | null;
    }
  | {
      type: "manual";
      name: string;
      phone: string;
    };

interface ClientSelectorProps {
  barbershopId: string;
  value: ClientSelection | null;
  onChange: (client: ClientSelection | null) => void;
  disabled?: boolean;
}

type ClientOption = {
  id: string;
  label: string;
  description?: string;
  clientId?: number | null;
  clientContactId?: number | null;
  name?: string | null;
  phone?: string | null;
};

const normalizePhoneKey = (phone?: string | null): string | null => {
  if (!phone) {
    return null;
  }
  const digits = phone.replace(/\D/g, "");
  return digits.length ? digits : null;
};

const formatPhoneLabel = (phone?: string | null): string | undefined => {
  if (!phone) {
    return undefined;
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return phone;
};

const buildClientOptions = (appointments: Appointment[]): ClientOption[] => {
  const map = new Map<string, ClientOption>();

  for (const appointment of appointments) {
    const clientId = appointment.client?.id ?? null;
    const contactId = appointment.clientContactId ?? null;
    const name =
      appointment.client?.name ??
      appointment.clientContact?.name ??
      null;
    const phone = appointment.clientContact?.phone ?? null;
    const normalizedPhoneKey = normalizePhoneKey(phone);

    const key =
      clientId !== null
        ? `client-${clientId}`
        : normalizedPhoneKey
        ? `phone-${normalizedPhoneKey}`
        : null;

    if (!key) {
      continue;
    }

    const label =
      name?.trim() ||
      formatPhoneLabel(phone) ||
      (clientId !== null ? `Cliente #${clientId}` : "Cliente");

    const option: ClientOption = {
      id: key,
      label,
      description: formatPhoneLabel(phone),
      clientId,
      clientContactId: contactId,
      name,
      phone,
    };

    if (!map.has(key)) {
      map.set(key, option);
      continue;
    }

    const existing = map.get(key)!;
    if (!existing.name && option.name) {
      existing.name = option.name;
      existing.label = option.label;
    }
    if (!existing.phone && option.phone) {
      existing.phone = option.phone;
      existing.description = option.description;
    }
    if (!existing.clientContactId && option.clientContactId) {
      existing.clientContactId = option.clientContactId;
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" })
  );
};

export function ClientSelector({
  barbershopId,
  value,
  onChange,
  disabled,
}: ClientSelectorProps) {
  const [options, setOptions] = useState<ClientOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    const loadClients = async () => {
      setIsLoading(true);
      try {
        const businessIdNum = parseInt(barbershopId, 10);
        if (Number.isNaN(businessIdNum)) {
          setOptions([]);
          return;
        }

        const appointments = await appointmentsAPI.getAll(businessIdNum);
        setOptions(buildClientOptions(appointments));
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching clients:", error);
        }
        toast.error("Erro ao carregar clientes");
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadClients();
  }, [barbershopId]);

  const manualName = value?.type === "manual" ? value.name : "";
  const manualPhone = value?.type === "manual" ? value.phone : "";

  const triggerLabel = useMemo(() => {
    if (!value) {
      return "Selecionar cliente";
    }

    if (value.type === "manual") {
      if (value.name?.trim() && value.phone?.trim()) {
        return `${value.name.trim()} (${formatPhoneLabel(value.phone) ?? value.phone})`;
      }
      if (value.name?.trim()) {
        return value.name.trim();
      }
      if (value.phone?.trim()) {
        return formatPhoneLabel(value.phone) ?? value.phone.trim();
      }
      return "Cliente personalizado";
    }

    const label =
      value.name?.trim() ||
      formatPhoneLabel(value.phone) ||
      (value.clientId ? `Cliente #${value.clientId}` : "Cliente selecionado");
    return label;
  }, [value]);

  const triggerDescription = useMemo(() => {
    if (!value || value.type === "manual") {
      return null;
    }
    const phoneLabel =
      formatPhoneLabel(value.phone) ?? value.phone?.trim() ?? "";
    return phoneLabel || null;
  }, [value]);

  const handleOptionSelect = (option: ClientOption) => {
    onChange({
      type: "existing",
      clientId: option.clientId,
      clientContactId: option.clientContactId ?? undefined,
      name: option.name ?? option.label,
      phone: option.phone ?? undefined,
    });
    setIsPopoverOpen(false);
  };

  const handleManualSelect = () => {
    onChange({
      type: "manual",
      name: manualName ?? "",
      phone: manualPhone ?? "",
    });
    setIsPopoverOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setIsPopoverOpen(false);
  };

  const handleManualFieldChange =
    (field: "name" | "phone") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;

      onChange({
        type: "manual",
        name: field === "name" ? nextValue : manualName ?? "",
        phone: field === "phone" ? nextValue : manualPhone ?? "",
      });
    };

  return (
    <div className="space-y-2">
      <Label>Cliente *</Label>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="flex flex-col items-start overflow-hidden text-left">
              <span className="truncate">{triggerLabel}</span>
              {triggerDescription && (
                <span className="truncate text-xs text-muted-foreground">
                  {triggerDescription}
                </span>
              )}
            </span>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <User className="h-4 w-4 flex-shrink-0" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <Command>
            <CommandInput placeholder="Buscar por nome ou telefone..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Carregando clientes..." : "Nenhum cliente encontrado"}
              </CommandEmpty>

              {options.length > 0 && (
                <CommandGroup heading="Clientes">
                  {options.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={`${option.label} ${option.description ?? ""}`}
                      onSelect={() => handleOptionSelect(option)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        {option.description && (
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <CommandSeparator />

              <CommandGroup heading="Ações">
                <CommandItem onSelect={handleManualSelect}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo cliente manual
                </CommandItem>
                {value && (
                  <CommandItem onSelect={handleClear}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Remover seleção
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value?.type === "manual" && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nome</Label>
            <Input
              value={manualName ?? ""}
              onChange={handleManualFieldChange("name")}
              placeholder="Nome do cliente"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Telefone</Label>
            <Input
              value={manualPhone ?? ""}
              onChange={handleManualFieldChange("phone")}
              placeholder="Telefone com DDD"
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}
