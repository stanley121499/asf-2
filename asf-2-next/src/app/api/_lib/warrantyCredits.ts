import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, TablesInsert } from "@/database.types";
import { calculateCreditAmount, roundMyr } from "@/modules/warranty/calculateCreditAmount";
import { formatClaimLabel } from "@/modules/claims/claimEligibility";
import {
  insertClaimStatusLog,
  notifyClaimStatusChange,
} from "@/modules/claims/claimNotifications";
import { loadWarrantyPolicyOrDefault } from "@/modules/warranty/loadWarrantyPolicy";

type ServiceClient = SupabaseClient<Database>;

export type ValidateWarrantyCreditSuccess = {
  valid: true;
  creditId: string;
  discountAmountMyr: number;
};

export type ValidateWarrantyCreditFailure = {
  valid: false;
  reason: string;
};

export type ValidateWarrantyCreditResult =
  | ValidateWarrantyCreditSuccess
  | ValidateWarrantyCreditFailure;

/**
 * Validates a warranty credit for cart application (does not mark as used).
 */
export async function validateWarrantyCreditForCart(
  supabase: ServiceClient,
  userId: string,
  creditId: string,
  cartSubtotalMyr: number
): Promise<ValidateWarrantyCreditResult> {
  if (!Number.isFinite(cartSubtotalMyr) || cartSubtotalMyr <= 0) {
    return { valid: false, reason: "Cart subtotal must be greater than zero" };
  }

  const { data: credit, error } = await supabase
    .from("warranty_credits")
    .select("*")
    .eq("id", creditId)
    .maybeSingle();

  if (error !== null) {
    console.error("validateWarrantyCreditForCart: query", error.message);
    return { valid: false, reason: "Could not validate warranty credit" };
  }

  if (credit === null) {
    return { valid: false, reason: "Warranty credit not found" };
  }

  if (credit.user_id !== userId) {
    return { valid: false, reason: "This credit does not belong to your account" };
  }

  if (credit.status !== "active") {
    return { valid: false, reason: "This warranty credit is no longer available" };
  }

  const now = new Date();
  const expiresAt = new Date(credit.expires_at);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < now.getTime()) {
    return { valid: false, reason: "This warranty credit has expired" };
  }

  const amountMyr = Number(credit.amount_myr);
  if (!Number.isFinite(amountMyr) || amountMyr <= 0) {
    return { valid: false, reason: "Invalid credit amount" };
  }

  const discountAmountMyr = roundMyr(Math.min(amountMyr, cartSubtotalMyr));

  return {
    valid: true,
    creditId: credit.id,
    discountAmountMyr,
  };
}

/** Per-item approval input for staff approve API. */
export interface ApproveClaimItemInput {
  claimItemId: string;
  approvedPercent: number;
}

/** Issued credit summary returned from approve flow. */
export interface IssuedWarrantyCreditSummary {
  id: string;
  claimItemId: string;
  amountMyr: number;
  approvedPercent: number;
  expiresAt: string;
}

/**
 * Staff approve: set per-item %, issue warranty credits, update claim status.
 */
export async function approveClaimAndIssueCredits(
  supabase: ServiceClient,
  params: {
    claimId: string;
    items: ApproveClaimItemInput[];
    staffUserId: string;
    staffNotes?: string | null;
  }
): Promise<
  | { ok: true; credits: IssuedWarrantyCreditSummary[] }
  | { ok: false; reason: string }
> {
  const { claimId, items, staffUserId, staffNotes } = params;

  if (items.length === 0) {
    return { ok: false, reason: "At least one claim item is required" };
  }

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("id, user_id, status, claim_type")
    .eq("id", claimId)
    .maybeSingle();

  if (claimError !== null) {
    console.error("approveClaimAndIssueCredits: claim query", claimError.message);
    return { ok: false, reason: "Could not load claim" };
  }

  if (claim === null) {
    return { ok: false, reason: "Claim not found" };
  }

  if (claim.status === "approved" || claim.status === "resolved") {
    return { ok: false, reason: "Claim has already been approved" };
  }

  const { data: claimItems, error: itemsError } = await supabase
    .from("claim_items")
    .select("*")
    .eq("claim_id", claimId);

  if (itemsError !== null) {
    console.error("approveClaimAndIssueCredits: claim items query", itemsError.message);
    return { ok: false, reason: "Could not load claim items" };
  }

  const itemMap = new Map((claimItems ?? []).map((row) => [row.id, row]));

  for (const input of items) {
    const row = itemMap.get(input.claimItemId);
    if (row === undefined) {
      return { ok: false, reason: `Claim item ${input.claimItemId} not found` };
    }
    if (input.approvedPercent < 0 || input.approvedPercent > 100) {
      return { ok: false, reason: "Approved percent must be between 0 and 100" };
    }
    if (row.warranty_credit_id !== null) {
      return { ok: false, reason: "Credits have already been issued for this claim" };
    }
  }

  const policyBundle = await loadWarrantyPolicyOrDefault(supabase);
  const expiryDays = policyBundle.policy.credit_expiry_days;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);
  const expiresAtIso = expiresAt.toISOString();

  const issuedCredits: IssuedWarrantyCreditSummary[] = [];

  for (const input of items) {
    const row = itemMap.get(input.claimItemId);
    if (row === undefined) {
      continue;
    }

    const linePrice = Number(row.line_item_price_myr);
    const creditAmount = calculateCreditAmount(linePrice, input.approvedPercent);

    const creditInsert: TablesInsert<"warranty_credits"> = {
      user_id: claim.user_id,
      claim_id: claimId,
      claim_item_id: input.claimItemId,
      amount_myr: creditAmount,
      approved_percent: input.approvedPercent,
      status: "active",
      expires_at: expiresAtIso,
      issued_by: staffUserId,
    };

    const { data: creditRow, error: creditError } = await supabase
      .from("warranty_credits")
      .insert(creditInsert)
      .select("*")
      .single();

    if (creditError !== null || creditRow === null) {
      console.error("approveClaimAndIssueCredits: credit insert", creditError?.message);
      return { ok: false, reason: creditError?.message ?? "Failed to issue warranty credit" };
    }

    const { error: updateItemError } = await supabase
      .from("claim_items")
      .update({
        approved_percent: input.approvedPercent,
        credit_amount_myr: creditAmount,
        warranty_credit_id: creditRow.id,
      })
      .eq("id", input.claimItemId);

    if (updateItemError !== null) {
      console.error("approveClaimAndIssueCredits: claim item update", updateItemError.message);
      return { ok: false, reason: "Failed to update claim item" };
    }

    issuedCredits.push({
      id: creditRow.id,
      claimItemId: input.claimItemId,
      amountMyr: creditAmount,
      approvedPercent: input.approvedPercent,
      expiresAt: expiresAtIso,
    });
  }

  const oldStatus = claim.status;

  const { error: claimUpdateError } = await supabase
    .from("claims")
    .update({
      status: "approved",
      updated_at: new Date().toISOString(),
      approved_resolution: "store_credit",
      policy_id: policyBundle.policy.id !== "default" ? policyBundle.policy.id : null,
      staff_notes:
        typeof staffNotes === "string" && staffNotes.trim().length > 0
          ? staffNotes.trim()
          : undefined,
    })
    .eq("id", claimId);

  if (claimUpdateError !== null) {
    console.error("approveClaimAndIssueCredits: claim update", claimUpdateError.message);
    return { ok: false, reason: "Failed to update claim status" };
  }

  await insertClaimStatusLog(supabase, {
    claimId,
    oldStatus,
    newStatus: "approved",
    changedBy: staffUserId,
    notes: staffNotes ?? "Approved and warranty credits issued",
  });

  const totalCredit = issuedCredits.reduce((sum, c) => sum + c.amountMyr, 0);
  const label = formatClaimLabel(claimId);
  const creditSummary = issuedCredits
    .map((c) => `RM ${c.amountMyr.toFixed(2)}`)
    .join(", ");

  await notifyClaimStatusChange(supabase, {
    userId: claim.user_id,
    claimId,
    newStatus: "approved",
    extraBody: `Warranty credit of ${creditSummary} (total RM ${totalCredit.toFixed(2)}) has been added to your account for claim ${label}. Valid until ${expiresAt.toLocaleDateString()}.`,
  });

  for (const credit of issuedCredits) {
    const notifyRow: TablesInsert<"notifications"> = {
      user_id: claim.user_id,
      type: "warranty_credit_issued",
      title: "Warranty Credit Issued",
      body: `RM ${credit.amountMyr.toFixed(2)} warranty credit is now available in your account. Valid until ${expiresAt.toLocaleDateString()}.`,
      metadata: {
        claim_id: claimId,
        claim_item_id: credit.claimItemId,
        warranty_credit_id: credit.id,
        amount_myr: credit.amountMyr,
      },
    };
    await supabase.from("notifications").insert(notifyRow);
  }

  return { ok: true, credits: issuedCredits };
}

/**
 * Marks a warranty credit as used after successful checkout.
 */
export async function consumeWarrantyCredit(
  supabase: ServiceClient,
  params: {
    creditId: string;
    userId: string;
    orderId: string;
    cartSubtotalMyr: number;
  }
): Promise<ValidateWarrantyCreditResult> {
  const validation = await validateWarrantyCreditForCart(
    supabase,
    params.userId,
    params.creditId,
    params.cartSubtotalMyr
  );

  if (validation.valid === false) {
    return validation;
  }

  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from("warranty_credits")
    .update({
      status: "used",
      used_at: nowIso,
      used_order_id: params.orderId,
      // Registration-issued and claim-issued credits both redeem online here.
      redemption_channel: "online",
    })
    .eq("id", params.creditId)
    .eq("user_id", params.userId)
    .eq("status", "active");

  if (error !== null) {
    console.error("consumeWarrantyCredit: update", error.message);
    return { valid: false, reason: "Failed to apply warranty credit" };
  }

  return validation;
}
