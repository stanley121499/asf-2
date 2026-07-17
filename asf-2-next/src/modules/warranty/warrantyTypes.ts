import type { Tables } from "@/database.types";

/** Active warranty policy with discount tiers. */
export interface WarrantyPolicyWithTiers {
  policy: Tables<"warranty_policies">;
  tiers: Tables<"warranty_discount_tiers">[];
}

/** Result of tier lookup for days since delivery. */
export interface WarrantyTierResult {
  discountPercent: number;
  tierFound: boolean;
}

/** Default tier rows when no DB policy exists. */
export const DEFAULT_WARRANTY_TIERS: readonly {
  daysFrom: number;
  daysTo: number;
  discountPercent: number;
  sortOrder: number;
}[] = [
  { daysFrom: 0, daysTo: 30, discountPercent: 75, sortOrder: 1 },
  { daysFrom: 31, daysTo: 60, discountPercent: 50, sortOrder: 2 },
  { daysFrom: 61, daysTo: 90, discountPercent: 25, sortOrder: 3 },
  { daysFrom: 91, daysTo: 365, discountPercent: 10, sortOrder: 4 },
];

export const DEFAULT_MAX_WARRANTY_DAYS = 365;
export const DEFAULT_CREDIT_EXPIRY_DAYS = 365;

/** Claim type key that uses automatic time-based tiers. */
export const AUTO_TIER_CLAIM_TYPE = "manufacturing_defect";
