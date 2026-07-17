import { NextResponse } from "next/server";

import { warrantyPolicyPatchBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";
import { loadWarrantyPolicyOrDefault } from "@/modules/warranty/loadWarrantyPolicy";
import { resolveWarrantyTier } from "@/modules/warranty/resolveWarrantyTier";

import type { Database } from "@/database.types";

type WarrantyPolicyRow = Database["public"]["Tables"]["warranty_policies"]["Row"];
type WarrantyTierRow = Database["public"]["Tables"]["warranty_discount_tiers"]["Row"];

interface RouteParams {
  params: { id: string };
}

/**
 * Validates tier rows do not overlap.
 */
function tiersOverlap(tiers: { days_from: number; days_to: number }[]): string | null {
  const sorted = [...tiers].sort((a, b) => a.days_from - b.days_from);
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev !== undefined && curr !== undefined && curr.days_from <= prev.days_to) {
      return "Tier day ranges must not overlap";
    }
  }
  return null;
}

/**
 * PATCH /api/warranty/policies/[id] — update policy and replace tiers.
 */
export async function PATCH(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }

  const validated = warrantyPolicyPatchBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }

  const supabase = createServiceRoleClient();
  const bundle = await loadWarrantyPolicyOrDefault(supabase);

  if (bundle.policy.id !== params.id && bundle.policy.id === "default") {
    return NextResponse.json({ error: "Policy not found in database" }, { status: 404 });
  }

  const policyId = bundle.policy.id === "default" ? params.id : params.id;

  const { data: existingPolicy, error: existingError } = await supabase
    .from("warranty_policies")
    .select("*")
    .eq("id", policyId)
    .maybeSingle();

  if (existingError !== null) {
    console.error("PATCH /api/warranty/policies/[id]", existingError.message);
    return NextResponse.json({ error: "Could not load policy" }, { status: 500 });
  }

  if (existingPolicy === null) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  const patch = validated.data;
  const policyUpdate: Partial<WarrantyPolicyRow> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.name !== undefined) {
    policyUpdate.name = patch.name;
  }
  if (patch.max_warranty_days !== undefined) {
    policyUpdate.max_warranty_days = patch.max_warranty_days;
  }
  if (patch.credit_expiry_days !== undefined) {
    policyUpdate.credit_expiry_days = patch.credit_expiry_days;
  }
  if (patch.module_label !== undefined) {
    policyUpdate.module_label = patch.module_label;
  }
  if (patch.active !== undefined) {
    policyUpdate.active = patch.active;
  }

  const { data: updatedPolicy, error: updateError } = await supabase
    .from("warranty_policies")
    .update(policyUpdate)
    .eq("id", policyId)
    .select("*")
    .single();

  if (updateError !== null || updatedPolicy === null) {
    console.error("PATCH policy update", updateError?.message);
    return NextResponse.json({ error: "Failed to update policy" }, { status: 400 });
  }

  let tiers: WarrantyTierRow[] = [];

  if (patch.tiers !== undefined) {
    const overlapError = tiersOverlap(patch.tiers);
    if (overlapError !== null) {
      return NextResponse.json({ error: overlapError }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from("warranty_discount_tiers")
      .delete()
      .eq("policy_id", policyId);

    if (deleteError !== null) {
      console.error("PATCH tier delete", deleteError.message);
      return NextResponse.json({ error: "Failed to replace tiers" }, { status: 500 });
    }

    const tierRows = patch.tiers.map((t) => ({
      policy_id: policyId,
      days_from: t.days_from,
      days_to: t.days_to,
      discount_percent: t.discount_percent,
      sort_order: t.sort_order,
    }));

    const { data: insertedTiers, error: insertError } = await supabase
      .from("warranty_discount_tiers")
      .insert(tierRows)
      .select("*");

    if (insertError !== null) {
      console.error("PATCH tier insert", insertError.message);
      return NextResponse.json({ error: "Failed to save tiers" }, { status: 400 });
    }

    tiers = (insertedTiers ?? []) as WarrantyTierRow[];
  } else {
    const { data: existingTiers, error: tiersError } = await supabase
      .from("warranty_discount_tiers")
      .select("*")
      .eq("policy_id", policyId)
      .order("sort_order", { ascending: true });

    if (tiersError !== null) {
      return NextResponse.json({ error: "Failed to load tiers" }, { status: 500 });
    }
    tiers = (existingTiers ?? []) as WarrantyTierRow[];
  }

  return NextResponse.json({
    policy: updatedPolicy as WarrantyPolicyRow,
    tiers,
    preview: resolveWarrantyTier(15, tiers, updatedPolicy.max_warranty_days),
  });
}
