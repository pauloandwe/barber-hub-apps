import { useState, useEffect } from "react";
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
import { addMinutes, startOfDay, setHours, setMinutes, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const OPENING_HOUR = 8;
const CLOSING_HOUR = 18;
const TIME_SLOT_INTERVAL_MINUTES = 30;

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
        <Label>Date *</Label>
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
          <Label htmlFor="time">Time *</Label>
          {isLoadingTimes ? (
            <LoadingSpinner size="small" />
          ) : availableTimes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No available times for this date
            </p>
          ) : (
            <Select value={selectedTime} onValueChange={onTimeChange}>
              <SelectTrigger id="time">
                <SelectValue placeholder="Select a time" />
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
