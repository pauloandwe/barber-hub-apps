import { appointmentsAPI, Appointment } from "./appointments";

export interface HairHubToolContext {
  businessId?: number;
  phoneNumber?: string;
  userId?: number;
}

export interface HairHubToolResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export const showAppointmentsTool = {
  name: "show_appointments",
  description:
    "Retrieves all appointments for a customer based on their phone number. Returns appointment details including date, time, service, barber, and status.",

  inputSchema: {
    type: "object",
    properties: {
      phoneNumber: {
        type: "string",
        description:
          "The customer's phone number (e.g., '5511987654321' or '+55 11 98765-4321')",
      },
      businessId: {
        type: "number",
        description: "Optional: Filter appointments for a specific business ID",
      },
    },
    required: ["phoneNumber"],
  },

  async execute(
    phoneNumber: string,
    businessId?: number
  ): Promise<HairHubToolResult> {
    try {
      if (!businessId) {
        throw new Error("businessId is required to retrieve appointments");
      }

      const appointments = await appointmentsAPI.getByPhoneNumber(
        businessId,
        phoneNumber
      );

      if (appointments.length === 0) {
        return {
          success: true,
          message: `No appointments found for phone number: ${phoneNumber}`,
          data: [],
        };
      }

      const formattedAppointments = appointments.map((apt) => ({
        id: apt.id,
        date: new Date(apt.startDate).toLocaleDateString("pt-BR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: new Date(apt.startDate).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        service: apt.service?.name || "Serviço não especificado",
        barber: apt.barber?.name || "Barbeiro não especificado",
        duration: apt.service?.duration || 0,
        status: apt.status,
        notes: apt.notes || "",
      }));

      return {
        success: true,
        message: `Found ${formattedAppointments.length} appointment(s) for ${phoneNumber}`,
        data: formattedAppointments,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        message: `Failed to retrieve appointments: ${errorMessage}`,
        error: errorMessage,
      };
    }
  },
};

export const getUpcomingAppointmentsTool = {
  name: "get_upcoming_appointments",
  description:
    "Retrieves upcoming appointments for a customer based on their phone number. Returns only future appointments.",

  inputSchema: {
    type: "object",
    properties: {
      phoneNumber: {
        type: "string",
        description: "The customer's phone number",
      },
      businessId: {
        type: "number",
        description: "Optional: Filter appointments for a specific business ID",
      },
      daysAhead: {
        type: "number",
        description: "Optional: Number of days to look ahead (default: 30)",
      },
    },
    required: ["phoneNumber"],
  },

  async execute(
    phoneNumber: string,
    businessId?: number,
    daysAhead: number = 30
  ): Promise<HairHubToolResult> {
    try {
      if (!businessId) {
        throw new Error("businessId is required to retrieve appointments");
      }

      const allAppointments = await appointmentsAPI.getByPhoneNumber(
        businessId,
        phoneNumber
      );

      const now = new Date();
      const futureDate = new Date(
        now.getTime() + daysAhead * 24 * 60 * 60 * 1000
      );

      const upcomingAppointments = allAppointments.filter((apt) => {
        const appointmentDate = new Date(apt.startDate);
        return appointmentDate >= now && appointmentDate <= futureDate;
      });

      const formattedAppointments = upcomingAppointments.map((apt) => ({
        id: apt.id,
        date: new Date(apt.startDate).toLocaleDateString("pt-BR", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        time: new Date(apt.startDate).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        service: apt.service?.name || "Serviço não especificado",
        barber: apt.barber?.name || "Barbeiro não especificado",
        status: apt.status,
      }));

      return {
        success: true,
        message: `Found ${formattedAppointments.length} upcoming appointment(s)`,
        data: formattedAppointments,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        message: `Failed to retrieve upcoming appointments: ${errorMessage}`,
        error: errorMessage,
      };
    }
  },
};

export const hairhubTools = {
  showAppointments: showAppointmentsTool,
  getUpcomingAppointments: getUpcomingAppointmentsTool,
};

export async function executeHairHubTool(
  toolName: string,
  params: any,
  context: HairHubToolContext
): Promise<HairHubToolResult> {
  try {
    switch (toolName) {
      case "show_appointments":
        return await showAppointmentsTool.execute(
          params.phoneNumber,
          context.businessId
        );

      case "get_upcoming_appointments":
        return await getUpcomingAppointmentsTool.execute(
          params.phoneNumber,
          context.businessId,
          params.daysAhead
        );

      default:
        return {
          success: false,
          message: `Tool not found: ${toolName}`,
          error: `Unknown tool: ${toolName}`,
        };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      message: `Error executing tool ${toolName}: ${errorMessage}`,
      error: errorMessage,
    };
  }
}
