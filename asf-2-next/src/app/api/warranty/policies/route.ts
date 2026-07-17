import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import { loadWarrantyPolicyOrDefault } from "@/modules/warranty/loadWarrantyPolicy";

import type { Database } from "@/database.types";

type WarrantyPolicyRow = Database["public"]["Tables"]["warranty_policies"]["Row"];
type WarrantyTierRow = Database["public"]["Tables"]["warranty_discount_tiers"]["Row"];

/**
 * GET /api/warranty/policies — active warranty policy and tiers.
 */
export async function GET(): Promise<NextResponse> {
  const supabase = createServiceRoleClient();
  const bundle = await loadWarrantyPolicyOrDefault(supabase);

  return NextResponse.json({
    policy: bundle.policy as WarrantyPolicyRow,
    tiers: bundle.tiers as WarrantyTierRow[],
  });
}
