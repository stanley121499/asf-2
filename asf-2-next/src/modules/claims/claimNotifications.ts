/**
 * Helpers for claim status transitions, notifications, and audit logging.
 *
 * Notification inserts go through {@link createCustomerNotification} (service-role
 * client required). Do not import this module into client components — call the
 * claim notify / status Route Handlers instead.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { createCustomerNotification } from "@/app/api/_lib/customerNotifications";
import type { Database, Json, TablesInsert } from "@/database.types";
import type { ClaimStatus } from "@/modules/claims/claimPolicyConfig";
import { formatClaimLabel } from "@/modules/claims/claimEligibility";
import { getClaimStatusLabel } from "@/modules/claims/claimPolicyConfig";

type DbClient = SupabaseClient<Database>;

/**
 * Inserts a status change log row for a claim.
 *
 * @param supabase - Privileged or staff-authorized Supabase client
 * @param params - Claim id, old/new status, actor, optional notes
 */
export async function insertClaimStatusLog(
  supabase: DbClient,
  params: {
    claimId: string;
    oldStatus: string | null;
    newStatus: string;
    changedBy: string | null;
    notes?: string | null;
  }
): Promise<void> {
  const row: TablesInsert<"claim_status_change_logs"> = {
    claim_id: params.claimId,
    old_status: params.oldStatus,
    new_status: params.newStatus,
    changed_by: params.changedBy,
    notes: params.notes ?? null,
  };
  await supabase.from("claim_status_change_logs").insert(row);
}

/**
 * Notifies the customer when claim status changes (`claim_status_changed`).
 * Uses DB templates via {@link createCustomerNotification}.
 *
 * @param supabase - Service-role (or otherwise privileged) Supabase client
 * @param params - Customer user id, claim id, new status; `extraBody` kept for callers
 */
export async function notifyClaimStatusChange(
  supabase: DbClient,
  params: {
    userId: string;
    claimId: string;
    newStatus: ClaimStatus;
    extraBody?: string;
  }
): Promise<void> {
  const claimLabel = formatClaimLabel(params.claimId);
  const statusLabel = getClaimStatusLabel(params.newStatus);

  const metadata: Json = {
    claim_id: params.claimId,
    status: params.newStatus,
  };

  const result = await createCustomerNotification({
    supabase,
    userId: params.userId,
    type: "claim_status_changed",
    vars: {
      claim_label: claimLabel,
      claim_id: params.claimId,
      status_label: statusLabel,
    },
    metadata,
  });

  if (result.notificationId === null && result.skipped === false) {
    console.error(
      "notifyClaimStatusChange: notification failed",
      params.claimId,
      params.newStatus
    );
  }
}

/**
 * Notifies the customer when a new claim is submitted (`claim_created`).
 * Uses DB templates via {@link createCustomerNotification}.
 *
 * @param supabase - Service-role (or otherwise privileged) Supabase client
 * @param params - Customer user id and claim id
 */
export async function notifyClaimSubmitted(
  supabase: DbClient,
  params: { userId: string; claimId: string }
): Promise<void> {
  const claimLabel = formatClaimLabel(params.claimId);

  const metadata: Json = {
    claim_id: params.claimId,
  };

  const result = await createCustomerNotification({
    supabase,
    userId: params.userId,
    type: "claim_created",
    vars: {
      claim_label: claimLabel,
      claim_id: params.claimId,
    },
    metadata,
  });

  if (result.notificationId === null && result.skipped === false) {
    console.error("notifyClaimSubmitted: notification failed", params.claimId);
  }
}
