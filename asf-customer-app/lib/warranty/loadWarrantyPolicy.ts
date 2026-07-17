import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/database.types";

import type { WarrantyPolicyWithTiers } from "./warrantyTypes";
import {
  DEFAULT_CREDIT_EXPIRY_DAYS,
  DEFAULT_MAX_WARRANTY_DAYS,
  DEFAULT_WARRANTY_TIERS,
} from "./warrantyTypes";

type SupabaseDbClient = SupabaseClient<Database>;

/**
 * Loads the active warranty policy and its tiers from the database.
 */
export async function loadWarrantyPolicy(
  supabase: SupabaseDbClient
): Promise<WarrantyPolicyWithTiers | null> {
  const { data: policy, error: policyError } = await supabase
    .from("warranty_policies")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (policyError !== null) {
    console.error("loadWarrantyPolicy: policy query", policyError.message);
    return null;
  }

  if (policy === null) {
    return null;
  }

  const { data: tiers, error: tiersError } = await supabase
    .from("warranty_discount_tiers")
    .select("*")
    .eq("policy_id", policy.id)
    .order("sort_order", { ascending: true });

  if (tiersError !== null) {
    console.error("loadWarrantyPolicy: tiers query", tiersError.message);
    return null;
  }

  return { policy, tiers: tiers ?? [] };
}

/**
 * Returns hardcoded default policy when DB has no active row.
 */
export function getDefaultWarrantyPolicy(): WarrantyPolicyWithTiers {
  const now = new Date().toISOString();
  return {
    policy: {
      id: "default",
      name: "Default Warranty Policy",
      active: true,
      max_warranty_days: DEFAULT_MAX_WARRANTY_DAYS,
      credit_expiry_days: DEFAULT_CREDIT_EXPIRY_DAYS,
      module_label: "Warranty & Returns",
      created_at: now,
      updated_at: now,
    },
    tiers: DEFAULT_WARRANTY_TIERS.map((t, index) => ({
      id: `default-tier-${String(index + 1)}`,
      policy_id: "default",
      days_from: t.daysFrom,
      days_to: t.daysTo,
      discount_percent: t.discountPercent,
      sort_order: t.sortOrder,
      created_at: now,
    })),
  };
}

/**
 * Loads active policy or falls back to defaults.
 */
export async function loadWarrantyPolicyOrDefault(
  supabase: SupabaseDbClient
): Promise<WarrantyPolicyWithTiers> {
  const loaded = await loadWarrantyPolicy(supabase);
  if (loaded === null || loaded.tiers.length === 0) {
    return getDefaultWarrantyPolicy();
  }
  return loaded;
}
