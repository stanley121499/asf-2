import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesUpdate } from "@/database.types";
import type { ClaimStatus } from "./claimPolicyConfig";
import {
  insertClaimStatusLog,
  notifyClaimStatusChange,
} from "./claimNotifications";

type DbClient = SupabaseClient<Database>;

/** Parameters for a staff-driven claim status transition. */
export interface ApplyClaimStatusChangeParams {
  supabase: DbClient;
  claimId: string;
  userId: string;
  oldStatus: string;
  newStatus: ClaimStatus;
  changedBy: string;
  updatePayload?: TablesUpdate<"claims">;
  notes?: string | null;
  notifyExtraBody?: string;
}

/**
 * Updates claim status, writes audit log, and notifies the customer.
 */
export async function applyClaimStatusChange(
  params: ApplyClaimStatusChangeParams
): Promise<boolean> {
  const payload: TablesUpdate<"claims"> = {
    status: params.newStatus,
    updated_at: new Date().toISOString(),
    ...params.updatePayload,
  };
  if (params.newStatus === "resolved") {
    payload.resolved_at = new Date().toISOString();
  }

  const { error } = await params.supabase
    .from("claims")
    .update(payload)
    .eq("id", params.claimId);

  if (error !== null) {
    return false;
  }

  await insertClaimStatusLog(params.supabase, {
    claimId: params.claimId,
    oldStatus: params.oldStatus,
    newStatus: params.newStatus,
    changedBy: params.changedBy,
    notes: params.notes ?? null,
  });

  await notifyClaimStatusChange(params.supabase, {
    userId: params.userId,
    claimId: params.claimId,
    newStatus: params.newStatus,
    extraBody: params.notifyExtraBody,
  });

  return true;
}
