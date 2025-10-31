/**
 * Hairhub Tools - Usage Examples
 *
 * This file demonstrates how to use the Hairhub AI assistant tools
 * in your application or integrate them with the WhatsApp bot.
 */

import { executeHairHubTool, HairHubToolContext } from "./hairhub-tools";

/**
 * Example 1: Show all appointments for a customer by phone number
 *
 * This example shows how to retrieve all appointments for a specific customer.
 */
export async function exampleShowAllAppointments() {
  const context: HairHubToolContext = {
    businessId: 1, // Your business ID
    phoneNumber: "5511987654321", // Customer's phone number
  };

  const result = await executeHairHubTool(
    "show_appointments",
    {
      phoneNumber: "5511987654321",
    },
    context
  );

  if (result.success) {
    console.log("Appointments found:");
    result.data?.forEach((apt: any) => {
      console.log(`
        Service: ${apt.service}
        Date: ${apt.date} at ${apt.time}
        Barber: ${apt.barber}
        Status: ${apt.status}
      `);
    });
  } else {
    console.error("Error:", result.error);
  }
}

/**
 * Example 2: Show upcoming appointments for a customer
 *
 * This example shows how to retrieve only future appointments.
 */
export async function exampleGetUpcomingAppointments() {
  const context: HairHubToolContext = {
    businessId: 1,
    phoneNumber: "5511987654321",
  };

  const result = await executeHairHubTool(
    "get_upcoming_appointments",
    {
      phoneNumber: "5511987654321",
      daysAhead: 30, // Look ahead 30 days (optional)
    },
    context
  );

  if (result.success) {
    console.log("Upcoming appointments:");
    result.data?.forEach((apt: any) => {
      console.log(`
        ${apt.service} with ${apt.barber}
        📅 ${apt.date} at ${apt.time}
      `);
    });
  } else {
    console.error("Error:", result.error);
  }
}

/**
 * Example 3: Integration with WhatsApp Bot
 *
 * This example shows how to integrate the tools with a WhatsApp bot handler.
 * This would be called when a user sends a message to the bot.
 */
export async function handleWhatsAppBotMessage(
  userMessage: string,
  userPhoneNumber: string,
  businessId: number
): Promise<string> {
  // Simple pattern matching for demonstration
  if (
    userMessage.toLowerCase().includes("meus agendamentos") ||
    userMessage.toLowerCase().includes("meus compromissos") ||
    userMessage.toLowerCase().includes("appointments")
  ) {
    const context: HairHubToolContext = {
      businessId,
      phoneNumber: userPhoneNumber,
    };

    const result = await executeHairHubTool(
      "show_appointments",
      {
        phoneNumber: userPhoneNumber,
      },
      context
    );

    if (result.success && result.data && result.data.length > 0) {
      let response =
        "📅 Seus agendamentos:\n\n";
      result.data.forEach((apt: any, index: number) => {
        response += `${index + 1}. ${apt.service}\n`;
        response += `   📍 ${apt.date} às ${apt.time}\n`;
        response += `   👨‍💼 Barbeiro: ${apt.barber}\n`;
        response += `   Status: ${apt.status}\n\n`;
      });
      return response;
    } else if (result.success) {
      return "Você não tem agendamentos registrados.";
    } else {
      return `Desculpe, houve um erro ao buscar seus agendamentos: ${result.error}`;
    }
  }

  if (
    userMessage.toLowerCase().includes("próximos") ||
    userMessage.toLowerCase().includes("upcoming")
  ) {
    const context: HairHubToolContext = {
      businessId,
      phoneNumber: userPhoneNumber,
    };

    const result = await executeHairHubTool(
      "get_upcoming_appointments",
      {
        phoneNumber: userPhoneNumber,
        daysAhead: 7, // Only next 7 days
      },
      context
    );

    if (result.success && result.data && result.data.length > 0) {
      let response = "📅 Seus próximos agendamentos:\n\n";
      result.data.forEach((apt: any) => {
        response += `🔸 ${apt.service}\n`;
        response += `   ${apt.date} às ${apt.time}\n`;
        response += `   ${apt.barber}\n\n`;
      });
      return response;
    } else if (result.success) {
      return "Você não tem agendamentos nos próximos 7 dias.";
    } else {
      return "Erro ao buscar agendamentos.";
    }
  }

  return "Desculpe, não entendi sua mensagem. Tente: 'meus agendamentos' ou 'próximos agendamentos'";
}

/**
 * Example 4: Format tool output for WhatsApp display
 *
 * Format the tool result in a way that's friendly for WhatsApp messages.
 */
export function formatAppointmentsForWhatsApp(appointments: any[]): string {
  if (appointments.length === 0) {
    return "Nenhum agendamento encontrado.";
  }

  let message = "📅 *Seus Agendamentos:*\n\n";

  appointments.forEach((apt, index) => {
    message += `*${index + 1}. ${apt.service}*\n`;
    message += `📅 ${apt.date} às ${apt.time}\n`;
    message += `👨‍💼 ${apt.barber}\n`;
    message += `⏱️ Duração: ${apt.duration} minutos\n`;
    message += `🔔 Status: ${apt.status}\n`;
    if (apt.notes) {
      message += `📝 Observações: ${apt.notes}\n`;
    }
    message += "\n";
  });

  return message;
}

/**
 * Example 5: Direct tool invocation without context
 *
 * For simple cases where you have all needed information.
 */
export async function getAppointmentsSimple(
  businessId: number,
  phoneNumber: string
) {
  const result = await executeHairHubTool(
    "show_appointments",
    {
      phoneNumber,
    },
    {
      businessId,
    }
  );

  return result;
}
