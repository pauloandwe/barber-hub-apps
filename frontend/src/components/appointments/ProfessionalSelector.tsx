import { useState, useEffect } from "react";
import { professionalsAPI } from "@/api/professionals";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export interface Professional {
  id: string;
  name: string;
}

interface ProfessionalSelectorProps {
  businessId: string;
  value: string;
  onChange: (professionalId: string) => void;
  disabled?: boolean;
}

export function ProfessionalSelector({
  businessId,
  value,
  onChange,
  disabled,
}: ProfessionalSelectorProps) {
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
      setProfessionals(
        data.map((b: any) => ({
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

  return (
    <div className="space-y-2">
      <Label htmlFor="professional">Professional *</Label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger id="professional">
          <SelectValue placeholder="Selecione um professional" />
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
  );
}
