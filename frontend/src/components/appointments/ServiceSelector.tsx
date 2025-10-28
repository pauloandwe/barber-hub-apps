import { useState, useEffect } from 'react';
import { servicesAPI } from '@/api/services';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
}

interface ServiceSelectorProps {
  barbershopId: string;
  value: string;
  onChange: (serviceId: string) => void;
  disabled?: boolean;
}

export function ServiceSelector({
  barbershopId,
  value,
  onChange,
  disabled,
}: ServiceSelectorProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, [barbershopId]);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const barbershopIdNum = parseInt(barbershopId, 10);
      const data = await servicesAPI.getAll(barbershopIdNum);
      setServices(
        data.map((s: any) => ({
          id: s.id.toString(),
          name: s.nome || s.name,
          durationMin: s.duracao || s.durationMin,
          priceCents: Math.round((s.preco || 0) * 100),
        }))
      );
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching services:', error);
      }
      toast.error('Error loading services');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="service">Service *</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
        <SelectTrigger id="service">
          <SelectValue placeholder="Select a service" />
        </SelectTrigger>
        <SelectContent>
          {services.map((service) => (
            <SelectItem key={service.id} value={service.id}>
              {service.name} - ${(service.priceCents / 100).toFixed(2)} (
              {service.durationMin} min)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
