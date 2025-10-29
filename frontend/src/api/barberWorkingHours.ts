import { apiClient } from "./client";

export interface BarberWorkingHour {
  id?: number;
  barberId: number;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  closed: boolean;
}

export interface BarberWorkingHourInput {
  dayOfWeek: number;
  openTime?: string | null;
  closeTime?: string | null;
  breakStart?: string | null;
  breakEnd?: string | null;
  closed: boolean;
}

const buildUrl = (barberId: number | string) =>
  `/barbers/${barberId}/working-hours`;

const extractWorkingHours = (response: any): BarberWorkingHour[] => {
  const directData = response?.data?.data;
  if (Array.isArray(directData)) {
    return directData;
  }

  const nestedData = directData?.data;
  if (Array.isArray(nestedData)) {
    return nestedData;
  }

  return [];
};

export const barberWorkingHoursAPI = {
  async getAll(barberId: number): Promise<BarberWorkingHour[]> {
    const response = await apiClient.get(buildUrl(barberId));
    const extract = extractWorkingHours(response);
    console.log("Upserted working hours:", response, extract);

    return extract;
  },

  async upsert(
    barberId: number,
    items: BarberWorkingHourInput[]
  ): Promise<BarberWorkingHour[]> {
    const response = await apiClient.put(buildUrl(barberId), { items });
    const extract = extractWorkingHours(response);
    console.log("Upserted working hours:", response, extract);
    return extract;
  },

  async clear(barberId: number): Promise<void> {
    await apiClient.delete(buildUrl(barberId));
  },
};
