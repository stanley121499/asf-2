/**
 * Helpers for claim status transitions, notifications, and audit logging.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesInsert } from "@/database.types";
import type { ClaimStatus } from "@/modules/claims/claimPolicyConfig";
import { formatClaimLabel } from "@/modules/claims/claimEligibility";
import { getClaimStatusLabel } from "@/modules/claims/claimPolicyConfig";

type DbClient = SupabaseClient<Database>;

/** Maps claim status to customer notification title. */
function notificationTitleForStatus(status: ClaimStatus): string {
  switch (status) {
    case "in_review":
      return "Claim Under Review";
    case "needs_info":
      return "More Information Needed";
    case "approved":
      return "Claim Approved";
    case "rejected":
      return "Claim Rejected";
    case "resolved":
      return "Claim Resolved";
    default:
      return "Claim Update";
  }
}

/**
 * Inserts a status change log row for a claim.
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
 * Sends a customer notification when claim status changes.
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
  const label = formatClaimLabel(params.claimId);
  const statusLabel = getClaimStatusLabel(params.newStatus);
  const bodyParts = [`Your claim ${label} is now: ${statusLabel}.`];
  if (typeof params.extraBody === "string" && params.extraBody.trim().length > 0) {
    bodyParts.push(params.extraBody.trim());
  }
  const row: TablesInsert<"notifications"> = {
    user_id: params.userId,
    type: "claim_status_changed",
    title: notificationTitleForStatus(params.newStatus),
    body: bodyParts.join(" "),
    metadata: { claim_id: params.claimId, status: params.newStatus },
  };
  await supabase.from("notifications").insert(row);
}

/**
 * Notifies customer when a new claim is submitted.
 */
export async function notifyClaimSubmitted(
  supabase: DbClient,
  params: { userId: string; claimId: string }
): Promise<void> {
  const label = formatClaimLabel(params.claimId);
  const row: TablesInsert<"notifications"> = {
    user_id: params.userId,
    type: "claim_created",
    title: "Claim Submitted",
    body: `We received your claim ${label}. Our team will review it shortly.`,
    metadata: { claim_id: params.claimId },
  };
  await supabase.from("notifications").insert(row);
}
