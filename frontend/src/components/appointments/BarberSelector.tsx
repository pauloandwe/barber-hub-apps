import { useState, useEffect } from 'react';
import { barbersAPI } from '@/api/barbers';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export interface Barber {
  id: string;
  name: string;
}

interface BarberSelectorProps {
  barbershopId: string;
  value: string;
  onChange: (barberId: string) => void;
  disabled?: boolean;
}

export function BarberSelector({
  barbershopId,
  value,
  onChange,
  disabled,
}: BarberSelectorProps) {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchBarbers();
  }, [barbershopId]);

  const fetchBarbers = async () => {
    setIsLoading(true);
    try {
      const barbershopIdNum = parseInt(barbershopId, 10);
      const data = await barbersAPI.getAll(barbershopIdNum);
      setBarbers(
        data.map((b: any) => ({
          id: b.id.toString(),
          name: b.nome || b.name,
        }))
      );
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching barbers:', error);
      }
      toast.error('Error loading barbers');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="barber">Barber *</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
        <SelectTrigger id="barber">
          <SelectValue placeholder="Select a barber" />
        </SelectTrigger>
        <SelectContent>
          {barbers.map((barber) => (
            <SelectItem key={barber.id} value={barber.id}>
              {barber.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
