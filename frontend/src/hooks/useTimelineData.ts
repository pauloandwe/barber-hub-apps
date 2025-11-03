import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  appointmentsAPI,
  AppointmentTimelineResponse,
} from "@/api/appointments";
import { format } from "date-fns";

interface UseTimelineDataOptions {
  businessId: number;
  date: Date;
  professionalIds?: number[];
  status?: "pending" | "confirmed" | "canceled";
  serviceId?: number;
  enabled?: boolean;
}

export function useTimelineData({
  businessId,
  date,
  professionalIds,
  status,
  serviceId,
  enabled = true,
}: UseTimelineDataOptions): UseQueryResult<AppointmentTimelineResponse, Error> {
  const dateString = format(date, "yyyy-MM-dd");

  return useQuery({
    queryKey: [
      "appointmentTimeline",
      businessId,
      dateString,
      professionalIds,
      status,
      serviceId,
    ],
    queryFn: () =>
      appointmentsAPI.getTimeline(
        businessId,
        dateString,
        professionalIds,
        status,
        serviceId
      ),
    enabled: enabled && businessId > 0,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useRefreshTimelineData() {
  const queryClient = require("@tanstack/react-query").useQueryClient();

  return {
    invalidateTimelineData: (
      businessId: number,
      date: Date,
      professionalIds?: number[]
    ) => {
      const dateString = format(date, "yyyy-MM-dd");
      queryClient.invalidateQueries({
        queryKey: ["appointmentTimeline", businessId, dateString],
      });
    },
    invalidateAllTimelines: (businessId: number) => {
      queryClient.invalidateQueries({
        queryKey: ["appointmentTimeline", businessId],
      });
    },
  };
}
