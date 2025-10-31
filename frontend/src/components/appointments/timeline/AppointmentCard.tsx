import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AppointmentTimelineCard } from "@/api/appointments";
import {
  MessageCircle,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatUtcTime } from "@/utils/date.utils";

interface AppointmentCardProps {
  appointment: AppointmentTimelineCard;
  slotDurationMinutes: number;
  slotHeightPx: number;
  onEdit?: (appointment: AppointmentTimelineCard) => void;
  onDelete?: (appointment: AppointmentTimelineCard) => void;
}

export function AppointmentCard({
  appointment,
  slotDurationMinutes,
  slotHeightPx,
  onEdit,
  onDelete,
}: AppointmentCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `appointment-${appointment.id}`,
      data: {
        appointmentId: appointment.id,
        barberId: appointment.barberId,
        startDate: appointment.startDate,
        type: "appointment",
      },
    });

  const startDate = new Date(appointment.startDate);
  const endDate = new Date(appointment.endDate);
  const durationMinutes =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60);
  const baseSlotDuration = Math.max(slotDurationMinutes, 1);
  const heightPx = (durationMinutes / baseSlotDuration) * slotHeightPx;

  const statusColor = {
    pending: "bg-yellow-100 border-yellow-400 text-yellow-900",
    confirmed: "bg-green-100 border-green-400 text-green-900",
    canceled: "bg-red-100 border-red-400 text-red-900 opacity-60",
  }[appointment.status];

  const startTimeStr = formatUtcTime(startDate);
  const endTimeStr = formatUtcTime(endDate);
  const clientName = appointment.clientContact.name || "Cliente";

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={setNodeRef}
              style={{
                height: `${heightPx}px`,
                transform: CSS.Translate.toString(transform),
                zIndex: isDragging ? 1000 : 1,
              }}
              className={cn(
                "absolute left-0 right-0 top-0 p-2 border rounded text-xs font-medium cursor-grab active:cursor-grabbing overflow-hidden transition-opacity",
                statusColor,
                isDragging && "opacity-50"
              )}
              {...attributes}
              {...listeners}
              onClick={(event) => {
                event.stopPropagation();
                onEdit?.(appointment);
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <div className="font-semibold line-clamp-1">
                    {startTimeStr}
                  </div>
                  <div className="text-xs line-clamp-1 truncate">
                    {clientName}
                  </div>
                  <div className="text-xs line-clamp-1 truncate">
                    {appointment.service.name}
                  </div>
                </div>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full p-1 text-muted-foreground/80 transition hover:bg-white/60 hover:text-foreground focus:outline-none"
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                    onTouchStart={(event) => event.stopPropagation()}
                    aria-label="Ações do agendamento"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
              </div>

              <div className="flex items-center gap-1 mt-2">
                <span className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold bg-white bg-opacity-50">
                  {appointment.status === "pending"
                    ? "Pendente"
                    : appointment.status === "confirmed"
                    ? "Confirmado"
                    : "Cancelado"}
                </span>
              </div>

              <div className="flex gap-1 mt-1">
                {appointment.notes && (
                  <FileText className="w-3 h-3" strokeWidth={2} />
                )}
                {appointment.source === "whatsapp" && (
                  <MessageCircle className="w-3 h-3" strokeWidth={2} />
                )}
              </div>
            </div>
          </TooltipTrigger>

          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">{clientName}</p>
              <p>{appointment.service.name}</p>
              <p>
                {startTimeStr} - {endTimeStr}
              </p>
              <p className="text-green-600">R$ {appointment.service.price}</p>
              {appointment.notes && (
                <p className="text-gray-500 italic">{appointment.notes}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent
          align="end"
          className="w-44"
          onClick={(event) => event.stopPropagation()}
        >
          <DropdownMenuItem
            onSelect={(event) => {
              event.stopPropagation();
              onEdit?.(appointment);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => {
              event.stopPropagation();
              onDelete?.(appointment);
            }}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
