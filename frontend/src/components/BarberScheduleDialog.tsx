import { useEffect, useMemo, useState } from "react";
import { Barber } from "@/api/barbers";
import {
  barberWorkingHoursAPI,
  BarberWorkingHour,
  BarberWorkingHourInput,
} from "@/api/barberWorkingHours";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { DialogProps } from "@/types/shared.types";

interface BarberScheduleDialogProps extends DialogProps {
  barber: Barber | null;
  onSaved?: () => void;
}

type ScheduleEntry = {
  dayOfWeek: number;
  label: string;
  closed: boolean;
  openTime: string;
  closeTime: string;
  breakStart: string;
  breakEnd: string;
};

const WEEK_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DEFAULT_DAY: Omit<ScheduleEntry, "dayOfWeek" | "label"> = {
  closed: true,
  openTime: "09:00",
  closeTime: "18:00",
  breakStart: "",
  breakEnd: "",
};

const minutesSinceMidnight = (value: string): number => {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
};

export function BarberScheduleDialog({ barber, open, onOpenChange, onSaved }: BarberScheduleDialogProps) {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const initialSchedule = useMemo(
    () =>
      WEEK_DAYS.map((label, index) => ({
        dayOfWeek: index,
        label,
        ...DEFAULT_DAY,
      })),
    []
  );

  useEffect(() => {
    if (!open) {
      setSchedule(initialSchedule);
      setIsLoading(false);
      setIsSaving(false);
      setIsClearing(false);
      return;
    }

    if (!barber) {
      return;
    }

    const loadSchedule = async () => {
      setIsLoading(true);
      try {
        const data = await barberWorkingHoursAPI.getAll(barber.id);
        if (!Array.isArray(data) || data.length === 0) {
          setSchedule(initialSchedule);
          return;
        }

        const mapped = initialSchedule.map((day) => {
          const record = data.find((item: BarberWorkingHour) => item.dayOfWeek === day.dayOfWeek);
          if (!record) {
            return day;
          }

          return {
            ...day,
            closed: record.closed,
            openTime: record.openTime ?? day.openTime,
            closeTime: record.closeTime ?? day.closeTime,
            breakStart: record.breakStart ?? "",
            breakEnd: record.breakEnd ?? "",
          };
        });

        setSchedule(mapped);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error loading barber schedule", error);
        }
        toast.error("Error loading schedule");
        setSchedule(initialSchedule);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedule();
  }, [open, barber, initialSchedule]);

  const handleToggleDay = (dayOfWeek: number, closed: boolean) => {
    setSchedule((prev) =>
      prev.map((entry) =>
        entry.dayOfWeek === dayOfWeek
          ? {
              ...entry,
              closed,
            }
          : entry
      )
    );
  };

  const handleTimeChange = (dayOfWeek: number, field: keyof ScheduleEntry, value: string) => {
    setSchedule((prev) =>
      prev.map((entry) =>
        entry.dayOfWeek === dayOfWeek
          ? {
              ...entry,
              [field]: value,
            }
          : entry
      )
    );
  };

  const validateSchedule = () => {
    for (const entry of schedule) {
      if (entry.closed) {
        continue;
      }

      if (!entry.openTime || !entry.closeTime) {
        toast.error(`Please provide start and end times for ${entry.label}`);
        return false;
      }

      const openMinutes = minutesSinceMidnight(entry.openTime);
      const closeMinutes = minutesSinceMidnight(entry.closeTime);

      if (closeMinutes <= openMinutes) {
        toast.error(`End time must be after start time for ${entry.label}`);
        return false;
      }

      const hasBreakStart = !!entry.breakStart;
      const hasBreakEnd = !!entry.breakEnd;

      if (hasBreakStart !== hasBreakEnd) {
        toast.error(`Please complete break interval for ${entry.label}`);
        return false;
      }

      if (hasBreakStart && hasBreakEnd) {
        const breakStart = minutesSinceMidnight(entry.breakStart);
        const breakEnd = minutesSinceMidnight(entry.breakEnd);

        if (breakStart < openMinutes || breakEnd > closeMinutes) {
          toast.error(`Break must stay within working hours for ${entry.label}`);
          return false;
        }

        if (breakEnd <= breakStart) {
          toast.error(`Break end must be after break start for ${entry.label}`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!barber) {
      return;
    }

    if (!validateSchedule()) {
      return;
    }

    setIsSaving(true);
    try {
      const payload: BarberWorkingHourInput[] = schedule.map((entry) => {
        const openTime = entry.closed ? null : entry.openTime.trim();
        const closeTime = entry.closed ? null : entry.closeTime.trim();
        const breakStart = entry.closed
          ? null
          : entry.breakStart?.trim() || null;
        const breakEnd = entry.closed ? null : entry.breakEnd?.trim() || null;

        return {
          dayOfWeek: entry.dayOfWeek,
          closed: entry.closed,
          openTime,
          closeTime,
          breakStart,
          breakEnd,
        };
      });

      await barberWorkingHoursAPI.upsert(barber.id, payload);
      toast.success("Schedule saved successfully!");
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error saving schedule", error);
      }
      toast.error("Error saving schedule");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    if (!barber) {
      return;
    }

    const confirmed = window.confirm(
      `This will clear all working hours for ${barber.name}. Continue?`
    );

    if (!confirmed) {
      return;
    }

    setIsClearing(true);
    try {
      await barberWorkingHoursAPI.clear(barber.id);
      toast.success("Schedule cleared successfully!");
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error clearing schedule", error);
      }
      toast.error("Error clearing schedule");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Barber Schedule</DialogTitle>
          <DialogDescription>
            {barber
              ? `Configure the weekly working hours for ${barber.name}`
              : "Select a barber to manage schedules"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
            {schedule.map((entry) => (
              <div
                key={entry.dayOfWeek}
                className="grid grid-cols-12 gap-3 items-center border rounded-lg p-3"
              >
                <div className="col-span-3">
                  <Label className="font-medium">{entry.label}</Label>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Switch
                    id={`day-${entry.dayOfWeek}`}
                    checked={!entry.closed}
                    onCheckedChange={(checked) =>
                      handleToggleDay(entry.dayOfWeek, !checked)
                    }
                    disabled={isSaving || !barber}
                  />
                  <span className="text-sm text-muted-foreground">
                    {entry.closed ? "Closed" : "Open"}
                  </span>
                </div>
                <div className="col-span-2">
                  <Input
                    type="time"
                    value={entry.openTime}
                    disabled={entry.closed || isSaving || !barber}
                    onChange={(event) =>
                      handleTimeChange(entry.dayOfWeek, "openTime", event.target.value)
                    }
                    step="300"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="time"
                    value={entry.closeTime}
                    disabled={entry.closed || isSaving || !barber}
                    onChange={(event) =>
                      handleTimeChange(entry.dayOfWeek, "closeTime", event.target.value)
                    }
                    step="300"
                  />
                </div>
                <div className="col-span-1">
                  <Input
                    type="time"
                    value={entry.breakStart}
                    placeholder="Break start"
                    disabled={entry.closed || isSaving || !barber}
                    onChange={(event) =>
                      handleTimeChange(entry.dayOfWeek, "breakStart", event.target.value)
                    }
                    step="300"
                  />
                </div>
                <div className="col-span-1">
                  <Input
                    type="time"
                    value={entry.breakEnd}
                    placeholder="Break end"
                    disabled={entry.closed || isSaving || !barber}
                    onChange={(event) =>
                      handleTimeChange(entry.dayOfWeek, "breakEnd", event.target.value)
                    }
                    step="300"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="destructive"
            onClick={handleClear}
            disabled={isSaving || isClearing || !barber}
          >
            {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Clear schedule
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving || isClearing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isClearing || !barber}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
