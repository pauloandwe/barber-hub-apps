import { Service } from "./ServiceSelector";

interface AppointmentSummaryProps {
  service: Service | undefined;
}

export function AppointmentSummary({ service }: AppointmentSummaryProps) {
  if (!service) return null;

  return (
    <div className="rounded-lg bg-muted p-4">
      <p className="text-sm font-medium">Resumo do Agendamento</p>
      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
        <p>
          <span className="font-medium">Serviço:</span> {service.name}
        </p>
        <p>
          <span className="font-medium">Duração:</span> {service.durationMin}{" "}
          minutos
        </p>
        <p>
          <span className="font-medium">Preço:</span> R${" "}
          {Number(service.price).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
