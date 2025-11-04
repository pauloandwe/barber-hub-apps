import { useState, useEffect } from "react";
import { professionalsAPI } from "@/api/professionals";
import { ProfessionalAssignmentStrategy } from "@/api/appointments";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export interface Professional {
  id: string;
  name: string;
}

interface ProfessionalSelectorWithAutoProps {
  businessId: string;
  value: {
    strategy: ProfessionalAssignmentStrategy;
    professionalId?: string;
  };
  onChange: (value: {
    strategy: ProfessionalAssignmentStrategy;
    professionalId?: string;
  }) => void;
  disabled?: boolean;
}

export function ProfessionalSelectorWithAuto({
  businessId,
  value,
  onChange,
  disabled,
}: ProfessionalSelectorWithAutoProps) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProfessionals();
  }, [businessId]);

  const fetchProfessionals = async () => {
    setIsLoading(true);
    try {
      const businessIdNum = parseInt(businessId, 10);
      const data = await professionalsAPI.getAll(businessIdNum);
      const activeProfessionals = (Array.isArray(data) ? data : []).filter(
        (professional) => professional && professional.active !== false
      );
      setProfessionals(
        activeProfessionals.map((b: any) => ({
          id: b.id.toString(),
          name: b.name,
        }))
      );
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching professionals:", error);
      }
      toast.error("Erro ao carregar barbeiros");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStrategyChange = (strategy: ProfessionalAssignmentStrategy) => {
    onChange({
      strategy,
      professionalId:
        strategy === ProfessionalAssignmentStrategy.MANUAL
          ? value.professionalId
          : undefined,
    });
  };

  const handleProfessionalChange = (professionalId: string) => {
    onChange({
      strategy: ProfessionalAssignmentStrategy.MANUAL,
      professionalId,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Profissional *</Label>
        <RadioGroup
          value={value.strategy}
          onValueChange={(strategy) =>
            handleStrategyChange(strategy as ProfessionalAssignmentStrategy)
          }
          className="mt-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value={ProfessionalAssignmentStrategy.MANUAL}
              id="professional-manual"
              disabled={disabled || isLoading}
            />
            <Label
              htmlFor="professional-manual"
              className="font-normal cursor-pointer"
            >
              Profissional Específico
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value={ProfessionalAssignmentStrategy.LEAST_APPOINTMENTS}
              id="professional-auto"
              disabled={disabled || isLoading}
            />
            <Label
              htmlFor="professional-auto"
              className="font-normal cursor-pointer"
            >
              Nenhum específico (auto-atribuir)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {value.strategy === ProfessionalAssignmentStrategy.MANUAL && (
        <div>
          <Label htmlFor="professional-select">Selecione o profissional</Label>
          <Select
            value={value.professionalId || ""}
            onValueChange={handleProfessionalChange}
            disabled={disabled || isLoading}
          >
            <SelectTrigger id="professional-select">
              <SelectValue placeholder="Selecione um profissional" />
            </SelectTrigger>
            <SelectContent>
              {professionals.map((professional) => (
                <SelectItem key={professional.id} value={professional.id}>
                  {professional.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {value.strategy === ProfessionalAssignmentStrategy.LEAST_APPOINTMENTS && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            ℹ️ O profissional será automaticamente atribuído para o profissional
            com menos agendamentos.
          </p>
        </div>
      )}
    </div>
  );
}
