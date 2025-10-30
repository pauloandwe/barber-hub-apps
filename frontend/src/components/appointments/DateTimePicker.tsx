import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ptBR } from "date-fns/locale";

interface DateTimePickerProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  selectedTime: string;
  onTimeChange: (time: string) => void;
  availableTimes: string[];
  isLoadingTimes: boolean;
  isDateRequired?: boolean;
}

export function DateTimePicker({
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  availableTimes,
  isLoadingTimes,
  isDateRequired = true,
}: DateTimePickerProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>Data *</Label>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateChange}
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          locale={ptBR}
          className="rounded-md border"
        />
      </div>

      {selectedDate && (
        <div className="space-y-2">
          <Label htmlFor="time">Horário *</Label>
          {isLoadingTimes ? (
            <LoadingSpinner size="small" />
          ) : availableTimes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem horários disponíveis para esta data
            </p>
          ) : (
            <Select value={selectedTime} onValueChange={onTimeChange}>
              <SelectTrigger id="time">
                <SelectValue placeholder="Selecione um horário" />
              </SelectTrigger>
              <SelectContent>
                {availableTimes.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </>
  );
}
