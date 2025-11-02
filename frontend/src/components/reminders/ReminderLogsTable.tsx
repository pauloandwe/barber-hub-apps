import { useState } from "react";
import { ReminderLog, ReminderStatus, remindersAPI } from "@/api/reminders";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Send,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReminderLogsTableProps {
  logs: ReminderLog[];
  onResendSuccess?: () => void;
}

const getStatusIcon = (status: ReminderStatus) => {
  switch (status) {
    case ReminderStatus.SENT:
      return <Send className="h-4 w-4 text-blue-600" />;
    case ReminderStatus.DELIVERED:
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case ReminderStatus.READ:
      return <Eye className="h-4 w-4 text-purple-600" />;
    case ReminderStatus.PENDING:
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case ReminderStatus.FAILED:
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return null;
  }
};

const getStatusColor = (status: ReminderStatus) => {
  switch (status) {
    case ReminderStatus.SENT:
      return "bg-blue-50 text-blue-700 border-blue-200";
    case ReminderStatus.DELIVERED:
      return "bg-green-50 text-green-700 border-green-200";
    case ReminderStatus.READ:
      return "bg-purple-50 text-purple-700 border-purple-200";
    case ReminderStatus.PENDING:
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case ReminderStatus.FAILED:
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "";
  }
};

const getStatusLabel = (status: ReminderStatus) => {
  switch (status) {
    case ReminderStatus.SENT:
      return "Enviado";
    case ReminderStatus.DELIVERED:
      return "Entregue";
    case ReminderStatus.READ:
      return "Lido";
    case ReminderStatus.PENDING:
      return "Pendente";
    case ReminderStatus.FAILED:
      return "Falhou";
    default:
      return status;
  }
};

export function ReminderLogsTable({ logs, onResendSuccess }: ReminderLogsTableProps) {
  const [resendingId, setResendingId] = useState<number | null>(null);

  const canResend = (status: ReminderStatus): boolean => {
    return status === ReminderStatus.FAILED || status === ReminderStatus.PENDING;
  };

  const handleResend = async (log: ReminderLog) => {
    if (!canResend(log.status)) {
      toast.error("Este lembrete não pode ser reenviado");
      return;
    }

    try {
      setResendingId(log.id);
      await remindersAPI.resendReminder(log.id);
      toast.success("Lembrete reenviado com sucesso!");
      onResendSuccess?.();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || "Erro ao reenviar lembrete";
      toast.error(errorMessage);
    } finally {
      setResendingId(null);
    }
  };

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">Nenhum log de lembrete encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {[
          {
            label: "Total",
            count: logs.length,
            color: "bg-gray-100 text-gray-700",
          },
          {
            label: "Enviados",
            count: logs.filter((l) => l.status === ReminderStatus.SENT).length,
            color: "bg-blue-100 text-blue-700",
          },
          {
            label: "Entregues",
            count: logs.filter((l) => l.status === ReminderStatus.DELIVERED).length,
            color: "bg-green-100 text-green-700",
          },
          {
            label: "Lidos",
            count: logs.filter((l) => l.status === ReminderStatus.READ).length,
            color: "bg-purple-100 text-purple-700",
          },
          {
            label: "Falhados",
            count: logs.filter((l) => l.status === ReminderStatus.FAILED).length,
            color: "bg-red-100 text-red-700",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-3 text-center">
              <p className="text-xs font-medium text-gray-600">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                {stat.count}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                    Mensagem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                    Agendado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                    Enviado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr
                    key={log.id}
                    className={`border-b transition-colors hover:bg-gray-50 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {log.type.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(
                          log.status
                        )}`}
                      >
                        {getStatusIcon(log.status)}
                        {getStatusLabel(log.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="truncate text-sm text-gray-600">
                        {log.message}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(
                        new Date(log.scheduledAt),
                        "dd/MM/yyyy HH:mm",
                        { locale: ptBR }
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.sentAt
                        ? format(
                            new Date(log.sentAt),
                            "dd/MM/yyyy HH:mm",
                            { locale: ptBR }
                          )
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {canResend(log.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResend(log)}
                          disabled={resendingId === log.id}
                          className="gap-2"
                        >
                          {resendingId === log.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Reenviando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4" />
                              Reenviar
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
