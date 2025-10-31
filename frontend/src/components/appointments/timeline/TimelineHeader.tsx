import { useState } from "react";
import { BarberTimeline } from "@/api/appointments";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  barbers: BarberTimeline[];
  selectedBarberIds?: number[];
  onBarberFilterChange?: (barberIds: number[]) => void;
  selectedStatus?: "pending" | "confirmed" | "canceled" | undefined;
  onStatusFilterChange?: (
    status: "pending" | "confirmed" | "canceled" | undefined
  ) => void;
  isLoading?: boolean;
}

export function TimelineHeader({
  currentDate,
  onDateChange,
  barbers,
  selectedBarberIds,
  onBarberFilterChange,
  selectedStatus,
  onStatusFilterChange,
  isLoading = false,
}: TimelineHeaderProps) {
  const [isAllBarbers, setIsAllBarbers] = useState(
    !selectedBarberIds || selectedBarberIds.length === barbers.length
  );

  const handlePreviousDay = () => {
    onDateChange(subDays(currentDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(currentDate, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const handleBarberToggle = (barberId: number) => {
    if (!onBarberFilterChange) return;

    const newSelected = selectedBarberIds ? [...selectedBarberIds] : [];
    const index = newSelected.indexOf(barberId);

    if (index > -1) {
      newSelected.splice(index, 1);
    } else {
      newSelected.push(barberId);
    }

    setIsAllBarbers(newSelected.length === barbers.length);
    onBarberFilterChange(newSelected.length > 0 ? newSelected : undefined);
  };

  const handleSelectAllBarbers = () => {
    if (!onBarberFilterChange) return;

    if (isAllBarbers) {
      onBarberFilterChange(undefined);
      setIsAllBarbers(false);
    } else {
      onBarberFilterChange(barbers.map((b) => b.id));
      setIsAllBarbers(true);
    }
  };

  const dayLabel = format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="space-y-4 p-4 bg-white border-b border-gray-200 rounded-t-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousDay}
            disabled={isLoading}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            disabled={isLoading}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Hoje
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextDay}
            disabled={isLoading}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900 capitalize">
            {dayLabel}
          </p>
          <p className="text-xs text-gray-500">
            {format(currentDate, "dd/MM/yyyy")}
          </p>
        </div>
        <div className="flex-1" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Barbeiros:</span>
          <Button
            variant={isAllBarbers ? "default" : "outline"}
            size="sm"
            onClick={handleSelectAllBarbers}
            disabled={isLoading}
          >
            Todos
          </Button>
          {barbers.map((barber) => {
            const isSelected =
              !selectedBarberIds || selectedBarberIds.includes(barber.id);
            return (
              <Button
                key={barber.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleBarberToggle(barber.id)}
                disabled={isLoading}
              >
                {barber.name}
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <Select
            value={selectedStatus || "all"}
            onValueChange={(value) =>
              onStatusFilterChange?.(
                value === "all"
                  ? undefined
                  : (value as "pending" | "confirmed" | "canceled")
              )
            }
            disabled={isLoading}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="canceled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
