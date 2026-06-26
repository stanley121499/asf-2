import { getClaimTypeConfig } from "./claimPolicyConfig";

/** Result of evaluating whether a claim type is eligible for an order. */
export interface ClaimEligibilityResult {
  eligible: boolean;
  reason: string;
  eligibleUntil: Date | null;
  daysRemaining: number | null;
}

/**
 * Order statuses that count as "delivered" for eligibility start date.
 */
const DELIVERED_STATUSES: readonly string[] = ["delivered", "completed"];

/**
 * Returns true when the order status indicates the customer has received the goods.
 */
export function isOrderDelivered(status: string | null): boolean {
  const key = (status ?? "").trim().toLowerCase();
  return DELIVERED_STATUSES.includes(key);
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
      reason: "未知的申请类型。",
      eligibleUntil: null,
      daysRemaining: null,
    };
  }

  if (!isOrderDelivered(orderStatus)) {
    return {
      eligible: false,
      reason: "订单送达后方可申请。",
      eligibleUntil: null,
      daysRemaining: null,
    };
  }

  const start = new Date(orderCreatedAt);
  if (Number.isNaN(start.getTime())) {
    return {
      eligible: false,
      reason: "无法确定订单日期。",
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
      reason: `已超过 ${String(typeConfig.eligibleDaysAfterDelivery)} 天申请期限。`,
      eligibleUntil,
      daysRemaining: 0,
    };
  }

  return {
    eligible: true,
    reason: `可申请至 ${eligibleUntil.toLocaleDateString()}`,
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
