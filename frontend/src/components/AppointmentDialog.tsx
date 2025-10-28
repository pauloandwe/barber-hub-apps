import { useState, useEffect } from 'react';
import { authAPI } from '@/api/auth';
import { appointmentsAPI } from '@/api/appointments';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { addMinutes, startOfDay, setHours, setMinutes, format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { DialogProps } from '@/types/shared.types';
import { ServiceSelector, Service } from './appointments/ServiceSelector';
import { BarberSelector } from './appointments/BarberSelector';
import { DateTimePicker } from './appointments/DateTimePicker';
import { AppointmentSummary } from './appointments/AppointmentSummary';

interface AppointmentDialogProps extends DialogProps {
  barbershopId: string;
  onSuccess: () => void;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  barbershopId,
  onSuccess,
}: AppointmentDialogProps) {
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const [services, setServices] = useState<Map<string, Service>>(new Map());

  useEffect(() => {
    const fetchAvailableTimes = async () => {
      if (!selectedDate || !selectedBarber || !selectedService) return;

      setIsLoadingTimes(true);
      try {
        const service = services.get(selectedService);
        if (!service) return;

        const startOfDay_ = startOfDay(selectedDate);
        const horarios: string[] = [];
        let currentTime = setHours(setMinutes(startOfDay_, 0), 8);
        const endTime = setHours(setMinutes(startOfDay_, 0), 18);
        const now = new Date();

        while (currentTime < endTime) {
          const timeFormatted = format(currentTime, 'HH:mm');
          const isPastTime =
            selectedDate.toDateString() === now.toDateString() && currentTime <= now;

          if (!isPastTime) {
            horarios.push(timeFormatted);
          }

          currentTime = addMinutes(currentTime, 30);
        }

        setAvailableTimes(horarios);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching available times:', error);
        }
        toast.error('Error loading available times');
      } finally {
        setIsLoadingTimes(false);
      }
    };

    if (selectedBarber && selectedDate && selectedService) {
      fetchAvailableTimes();
    }
  }, [selectedBarber, selectedDate, selectedService, services]);

  const handleSubmit = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const user = authAPI.getStoredUser();
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      const service = services.get(selectedService);
      if (!service) return;

      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDateTime = setHours(setMinutes(selectedDate, minutes), hours);
      const endDateTime = addMinutes(startDateTime, service.durationMin);
      const barbershopIdNum = parseInt(barbershopId, 10);

      await appointmentsAPI.create(barbershopIdNum, {
        barberId: parseInt(selectedBarber, 10),
        clientId: user.id,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        notes: notes || undefined,
        status: 'pending',
        source: 'web',
      });

      toast.success('Appointment created successfully!');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating appointment:', error);
      }
      toast.error('Error creating appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedService('');
    setSelectedBarber('');
    setSelectedDate(undefined);
    setSelectedTime('');
    setNotes('');
    setAvailableTimes([]);
  };

  const selectedServiceData = services.get(selectedService);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>Fill in the data to schedule your appointment</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <ServiceSelector
            barbershopId={barbershopId}
            value={selectedService}
            onChange={(serviceId) => {
              setSelectedService(serviceId);
              setSelectedTime('');
            }}
            disabled={isLoading}
          />

          <BarberSelector
            barbershopId={barbershopId}
            value={selectedBarber}
            onChange={setSelectedBarber}
            disabled={isLoading}
          />

          <DateTimePicker
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedTime={selectedTime}
            onTimeChange={setSelectedTime}
            availableTimes={availableTimes}
            isLoadingTimes={isLoadingTimes}
          />

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <AppointmentSummary service={selectedServiceData} />
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              !selectedService ||
              !selectedBarber ||
              !selectedDate ||
              !selectedTime
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Appointment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AppointmentDialog;
