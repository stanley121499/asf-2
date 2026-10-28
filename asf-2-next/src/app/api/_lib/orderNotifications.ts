/**
 * Server helpers for order-related customer notifications.
 * Pass a service-role Supabase client from trusted Route Handlers only.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { createCustomerNotification } from "@/app/api/_lib/customerNotifications";
import type { Database, Json } from "@/database.types";

type ServiceClient = SupabaseClient<Database>;

/**
 * Formats a short public order reference from UUID (matches Stripe webhook labels).
 *
 * @param orderId - Order UUID
 * @returns Display label such as `#A1B2C3D4`
 */
export function formatOrderLabel(orderId: string): string {
  const shortRef = orderId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `#${shortRef}`;
}

/**
 * Capitalizes an order status for template `{{status_label}}`.
 *
 * @param status - Raw status string
 * @returns Human-readable status label
 */
export function formatOrderStatusLabel(status: string): string {
  const trimmed = status.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1).toLowerCase()}`;
}

/**
 * Notifies the customer when staff changes order status (`order_status_changed`).
 *
 * @param supabase - Service-role Supabase client
 * @param params - Customer user id, order id, old/new status
 */
export async function notifyOrderStatusChanged(
  supabase: ServiceClient,
  params: {
    userId: string;
    orderId: string;
    oldStatus: string | null;
    newStatus: string;
  }
): Promise<void> {
  const orderLabel = formatOrderLabel(params.orderId);
  const oldStatus = params.oldStatus ?? "none";
  const statusLabel = formatOrderStatusLabel(params.newStatus);

  const metadata: Json = {
    order_id: params.orderId,
    old_status: oldStatus,
    new_status: params.newStatus,
  };

  const result = await createCustomerNotification({
    supabase,
    userId: params.userId,
    type: "order_status_changed",
    vars: {
      order_label: orderLabel,
      order_id: params.orderId,
      old_status: oldStatus,
      new_status: params.newStatus,
      status_label: statusLabel,
    },
    metadata,
  });

  if (result.notificationId === null && result.skipped === false) {
    console.error(
      "notifyOrderStatusChanged: notification failed",
      params.orderId,
      params.newStatus
    );
  }
}
