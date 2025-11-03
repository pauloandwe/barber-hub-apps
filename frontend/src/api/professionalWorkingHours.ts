import { apiClient } from "./client";

export interface ProfessionalWorkingHour {
  id?: number;
  professionalId: number;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  closed: boolean;
}

export interface ProfessionalWorkingHourInput {
  dayOfWeek: number;
  openTime?: string | null;
  closeTime?: string | null;
  breakStart?: string | null;
  breakEnd?: string | null;
  closed: boolean;
}

const buildUrl = (professionalId: number | string) =>
  `/professionals/${professionalId}/working-hours`;

const extractWorkingHours = (response: any): ProfessionalWorkingHour[] => {
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

export const professionalWorkingHoursAPI = {
  async getAll(professionalId: number): Promise<ProfessionalWorkingHour[]> {
    const response = await apiClient.get(buildUrl(professionalId));
    const extract = extractWorkingHours(response);
    console.log("Upserted working hours:", response, extract);

    return extract;
  },

  async upsert(
    professionalId: number,
    items: ProfessionalWorkingHourInput[]
  ): Promise<ProfessionalWorkingHour[]> {
    const response = await apiClient.put(buildUrl(professionalId), { items });
    const extract = extractWorkingHours(response);
    console.log("Upserted working hours:", response, extract);
    return extract;
  },

  async clear(professionalId: number): Promise<void> {
    await apiClient.delete(buildUrl(professionalId));
  },
};
