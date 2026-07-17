import { getClaimTypeConfig } from "./claimPolicyConfig";
import { calculateCreditAmount } from "@/modules/warranty/calculateCreditAmount";
import { loadWarrantyPolicyOrDefault } from "@/modules/warranty/loadWarrantyPolicy";
import {
  computeDaysSinceDelivery,
  resolveDeliveryDate,
} from "@/modules/warranty/resolveDeliveryDate";
import { resolveWarrantyTier } from "@/modules/warranty/resolveWarrantyTier";
import { AUTO_TIER_CLAIM_TYPE } from "@/modules/warranty/warrantyTypes";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/database.types";

type ServiceClient = SupabaseClient<Database>;

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

/** Server-side warranty credit estimate for a single order line item. */
export interface WarrantyCreditEstimate {
  orderItemId: string;
  eligible: boolean;
  reason: string;
  daysSinceDelivery: number | null;
  deliveryDate: string | null;
  usesAutoTier: boolean;
  recommendedPercent: number | null;
  lineItemPriceMyr: number;
  estimatedCreditMyr: number;
}

/**
 * Evaluates estimated warranty credit for one order item (non-binding until staff approves).
 */
export async function evaluateWarrantyCreditEstimate(
  supabase: ServiceClient,
  claimTypeKey: string,
  orderId: string,
  orderItemId: string,
  referenceDate: Date = new Date()
): Promise<WarrantyCreditEstimate> {
  const base: WarrantyCreditEstimate = {
    orderItemId,
    eligible: false,
    reason: "",
    daysSinceDelivery: null,
    deliveryDate: null,
    usesAutoTier: claimTypeKey === AUTO_TIER_CLAIM_TYPE,
    recommendedPercent: null,
    lineItemPriceMyr: 0,
    estimatedCreditMyr: 0,
  };

  const typeConfig = getClaimTypeConfig(claimTypeKey);
  if (typeConfig === undefined) {
    return { ...base, reason: "未知的申请类型。" };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("status, user_id")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError !== null) {
    console.error("evaluateWarrantyCreditEstimate: order query", orderError.message);
    return { ...base, reason: "无法加载订单信息。" };
  }

  if (order === null) {
    return { ...base, reason: "订单不存在。" };
  }

  if (!isOrderDelivered(order.status)) {
    return { ...base, reason: "订单送达后方可申请。" };
  }

  const { data: orderItem, error: itemError } = await supabase
    .from("order_items")
    .select("id, order_id, amount, product_id")
    .eq("id", orderItemId)
    .maybeSingle();

  if (itemError !== null) {
    console.error("evaluateWarrantyCreditEstimate: order item query", itemError.message);
    return { ...base, reason: "无法加载订单商品。" };
  }

  if (orderItem === null || orderItem.order_id !== orderId) {
    return { ...base, reason: "订单商品不存在。" };
  }

  const lineItemPriceMyr = Number(orderItem.amount ?? 0);
  const policyBundle = await loadWarrantyPolicyOrDefault(supabase);
  const { deliveryDate } = await resolveDeliveryDate(supabase, orderId);

  if (deliveryDate === null) {
    return {
      ...base,
      lineItemPriceMyr,
      reason: "无法确定送达日期。",
    };
  }

  const daysSinceDelivery = computeDaysSinceDelivery(deliveryDate, referenceDate);

  if (claimTypeKey !== AUTO_TIER_CLAIM_TYPE) {
    return {
      ...base,
      eligible: true,
      lineItemPriceMyr,
      deliveryDate,
      daysSinceDelivery,
      reason: "客服将根据情况确定抵扣金额。",
      estimatedCreditMyr: 0,
      recommendedPercent: null,
      usesAutoTier: false,
    };
  }

  if (daysSinceDelivery < 0) {
    return {
      ...base,
      lineItemPriceMyr,
      deliveryDate,
      reason: "无法计算送达天数。",
    };
  }

  if (daysSinceDelivery > policyBundle.policy.max_warranty_days) {
    return {
      ...base,
      lineItemPriceMyr,
      deliveryDate,
      daysSinceDelivery,
      reason: `已超过 ${String(policyBundle.policy.max_warranty_days)} 天保固期限。`,
      recommendedPercent: 0,
    };
  }

  const tierResult = resolveWarrantyTier(
    daysSinceDelivery,
    policyBundle.tiers,
    policyBundle.policy.max_warranty_days
  );

  const recommendedPercent = tierResult.discountPercent;
  const estimatedCreditMyr = calculateCreditAmount(lineItemPriceMyr, recommendedPercent);

  if (!tierResult.tierFound || recommendedPercent <= 0) {
    return {
      ...base,
      lineItemPriceMyr,
      deliveryDate,
      daysSinceDelivery,
      recommendedPercent: 0,
      reason: "已超过自动抵扣期限。",
      estimatedCreditMyr: 0,
    };
  }

  return {
    orderItemId,
    eligible: true,
    reason: `预估抵扣 ${String(recommendedPercent)}%（待审核）`,
    daysSinceDelivery,
    deliveryDate,
    usesAutoTier: true,
    recommendedPercent,
    lineItemPriceMyr,
    estimatedCreditMyr,
  };
}
