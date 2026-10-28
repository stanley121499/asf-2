/**
 * Server helpers for support-ticket customer notifications.
 * Pass a service-role Supabase client from trusted Route Handlers only.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { createCustomerNotification } from "@/app/api/_lib/customerNotifications";
import type { Database, Json } from "@/database.types";

type ServiceClient = SupabaseClient<Database>;

/**
 * Formats a short public ticket reference from UUID (matches web/Expo support UI).
 *
 * @param ticketId - Ticket UUID
 * @returns Display label such as `TK-A1B2C3D4`
 */
export function formatTicketLabel(ticketId: string): string {
  const compact = ticketId.replace(/-/g, "");
  return `TK-${compact.slice(0, 8).toUpperCase()}`;
}

/**
 * Notifies the customer when a support ticket is created (`ticket_created`).
 *
 * @param supabase - Service-role Supabase client
 * @param params - Customer user id and ticket id
 */
export async function notifyTicketCreated(
  supabase: ServiceClient,
  params: { userId: string; ticketId: string }
): Promise<void> {
  const ticketLabel = formatTicketLabel(params.ticketId);

  const metadata: Json = {
    ticket_id: params.ticketId,
  };

  const result = await createCustomerNotification({
    supabase,
    userId: params.userId,
    type: "ticket_created",
    vars: {
      ticket_label: ticketLabel,
    },
    metadata,
  });

  if (result.notificationId === null && result.skipped === false) {
    console.error("notifyTicketCreated: notification failed", params.ticketId);
  }
}

/**
 * Notifies the customer when staff replies on a support ticket (`ticket_replied`).
 *
 * @param supabase - Service-role Supabase client
 * @param params - Customer user id and ticket id
 */
export async function notifyTicketReplied(
  supabase: ServiceClient,
  params: { userId: string; ticketId: string }
): Promise<void> {
  const ticketLabel = formatTicketLabel(params.ticketId);

  const metadata: Json = {
    ticket_id: params.ticketId,
  };

  const result = await createCustomerNotification({
    supabase,
    userId: params.userId,
    type: "ticket_replied",
    vars: {
      ticket_label: ticketLabel,
    },
    metadata,
  });

  if (result.notificationId === null && result.skipped === false) {
    console.error("notifyTicketReplied: notification failed", params.ticketId);
  }
}
