import { formatDate } from "@/i18n/format";
import type { Locale } from "@/i18n/types";

import { getClaimTypeConfig, type ClaimTranslateFn } from "./claimPolicyConfig";

/** Order statuses that count as delivered for eligibility. */
const DELIVERED_STATUSES: readonly string[] = ["delivered", "completed"];

/**
 * Returns true when the order status indicates the customer has received the goods.
 */
export function isOrderDelivered(status: string | null): boolean {
  const key = (status ?? "").trim().toLowerCase();
  return DELIVERED_STATUSES.includes(key);
}

/** Result of evaluating whether a claim type is eligible for an order. */
export interface ClaimEligibilityResult {
  eligible: boolean;
  reasonKey: string;
  reasonParams?: Record<string, string | number>;
  eligibleUntil: Date | null;
  daysRemaining: number | null;
}

/**
 * Formats a claim eligibility result for display using the active locale.
 */
export function formatClaimEligibilityReason(
  result: Pick<ClaimEligibilityResult, "reasonKey" | "reasonParams" | "eligibleUntil">,
  t: ClaimTranslateFn,
  locale: Locale
): string {
  if (result.reasonKey === "claims.eligibility.eligibleUntil" && result.eligibleUntil !== null) {
    return t(result.reasonKey, {
      date: formatDate(locale, result.eligibleUntil.toISOString()),
    });
  }
  return t(result.reasonKey, result.reasonParams);
}

/**
 * Computes claim eligibility from order delivery date and claim type policy.
 */
export function evaluateClaimEligibility(
  claimTypeKey: string,
  orderStatus: string | null,
  orderCreatedAt: string,
  referenceDate: Date = new Date()
): ClaimEligibilityResult {
  const typeConfig = getClaimTypeConfig(claimTypeKey);
  if (typeConfig === undefined) {
    return {
      eligible: false,
      reasonKey: "claims.eligibility.unknownType",
      eligibleUntil: null,
      daysRemaining: null,
    };
  }

  if (!isOrderDelivered(orderStatus)) {
    return {
      eligible: false,
      reasonKey: "claims.eligibility.orderNotDelivered",
      eligibleUntil: null,
      daysRemaining: null,
    };
  }

  const start = new Date(orderCreatedAt);
  if (Number.isNaN(start.getTime())) {
    return {
      eligible: false,
      reasonKey: "claims.eligibility.invalidOrderDate",
      eligibleUntil: null,
      daysRemaining: null,
    };
  }

  const eligibleUntil = new Date(start);
  eligibleUntil.setDate(eligibleUntil.getDate() + typeConfig.eligibleDaysAfterDelivery);

  const msRemaining = eligibleUntil.getTime() - referenceDate.getTime();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      eligible: false,
      reasonKey: "claims.eligibility.expired",
      reasonParams: { days: typeConfig.eligibleDaysAfterDelivery },
      eligibleUntil,
      daysRemaining: 0,
    };
  }

  return {
    eligible: true,
    reasonKey: "claims.eligibility.eligibleUntil",
    eligibleUntil,
    daysRemaining,
  };
}

/**
 * Formats a short public claim reference from UUID.
 */
export function formatClaimLabel(claimId: string): string {
  const compact = claimId.replace(/-/g, "");
  return `CL-${compact.slice(0, 8).toUpperCase()}`;
}
