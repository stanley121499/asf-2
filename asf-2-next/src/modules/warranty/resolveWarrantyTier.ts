import type { Tables } from "@/database.types";

import type { WarrantyTierResult } from "./warrantyTypes";
import { DEFAULT_WARRANTY_TIERS } from "./warrantyTypes";

type TierRow = Tables<"warranty_discount_tiers"> | {
  days_from: number;
  days_to: number;
  discount_percent: number;
  sort_order: number;
};

/**
 * Returns recommended discount percent for days since delivery.
 */
export function resolveWarrantyTier(
  daysSinceDelivery: number,
  tiers: readonly TierRow[],
  maxWarrantyDays: number
): WarrantyTierResult {
  if (daysSinceDelivery < 0 || daysSinceDelivery > maxWarrantyDays) {
    return { discountPercent: 0, tierFound: false };
  }

  const sorted = [...tiers].sort((a, b) => a.sort_order - b.sort_order);
  for (const tier of sorted) {
    if (daysSinceDelivery >= tier.days_from && daysSinceDelivery <= tier.days_to) {
      const percent = Number(tier.discount_percent);
      return {
        discountPercent: Number.isFinite(percent) ? percent : 0,
        tierFound: true,
      };
    }
  }

  return { discountPercent: 0, tierFound: false };
}

/**
 * Resolves tier using hardcoded defaults when DB policy is unavailable.
 */
export function resolveWarrantyTierFromDefaults(daysSinceDelivery: number): WarrantyTierResult {
  const defaultTiers = DEFAULT_WARRANTY_TIERS.map((t) => ({
    days_from: t.daysFrom,
    days_to: t.daysTo,
    discount_percent: t.discountPercent,
    sort_order: t.sortOrder,
  }));
  return resolveWarrantyTier(daysSinceDelivery, defaultTiers, 365);
}
