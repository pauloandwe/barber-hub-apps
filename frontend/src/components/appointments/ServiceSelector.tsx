import { useState, useEffect } from "react";
import { servicesAPI } from "@/api/services";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
}

interface ServiceSelectorProps {
  businessId: string;
  value: string;
  onChange: (serviceId: string) => void;
  disabled?: boolean;
  onLoaded?: (services: Service[]) => void;
}

export function ServiceSelector({
  businessId,
  value,
  onChange,
  disabled,
  onLoaded,
}: ServiceSelectorProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, [businessId]);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const businessIdNum = parseInt(businessId, 10);
      const data = await servicesAPI.getAll(businessIdNum);
      const mapped = data.map((s: any) => ({
        id: s.id.toString(),
        name: s.name,
        durationMin: s.duration,
        priceCents: s.price,
      }));

      setServices(mapped);
      onLoaded?.(mapped);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching services:", error);
      }
      toast.error("Erro ao carregar serviços");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="service">Serviço *</Label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger id="service">
          <SelectValue placeholder="Selecione um serviço" />
        </SelectTrigger>
        <SelectContent>
          {services.map((service) => (
            <SelectItem key={service.id} value={service.id}>
              {service.name} - R$ {(service.priceCents / 100).toFixed(2)} (
              {service.durationMin} min)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
