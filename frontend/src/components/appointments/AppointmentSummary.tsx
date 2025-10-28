import { Service } from './ServiceSelector';

interface AppointmentSummaryProps {
  service: Service | undefined;
}

export function AppointmentSummary({ service }: AppointmentSummaryProps) {
  if (!service) return null;

  return (
    <div className="rounded-lg bg-muted p-4">
      <p className="text-sm font-medium">Appointment Summary</p>
      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
        <p>
          <span className="font-medium">Service:</span> {service.name}
        </p>
        <p>
          <span className="font-medium">Duration:</span> {service.durationMin} minutes
        </p>
        <p>
          <span className="font-medium">Price:</span> ${(service.priceCents / 100).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
