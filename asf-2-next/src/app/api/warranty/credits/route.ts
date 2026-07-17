import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/app/api/_lib/apiAuth";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";

/**
 * GET /api/warranty/credits — list credits for the authenticated customer.
 */
export async function GET(): Promise<NextResponse> {
  const auth = await requireAuthenticatedUser();
  if (auth.ok === false) {
    return auth.response;
  }

  const supabase = createServiceRoleClient();
  const { data: credits, error } = await supabase
    .from("warranty_credits")
    .select(
      `
      id,
      amount_myr,
      approved_percent,
      status,
      expires_at,
      used_at,
      claim_id,
      claim_item_id,
      claim_items (
        product_id,
        products ( name )
      )
    `
    )
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error !== null) {
    console.error("GET /api/warranty/credits", error.message);
    return NextResponse.json({ error: "Failed to load warranty credits" }, { status: 500 });
  }

  const mapped = (credits ?? []).map((row) => {
    const claimItem = row.claim_items;
    let productName = "Order item";
    if (
      claimItem !== null &&
      typeof claimItem === "object" &&
      "products" in claimItem &&
      claimItem.products !== null &&
      typeof claimItem.products === "object" &&
      "name" in claimItem.products &&
      typeof claimItem.products.name === "string"
    ) {
      productName = claimItem.products.name;
    }

    return {
      id: row.id,
      amountMyr: Number(row.amount_myr),
      approvedPercent: Number(row.approved_percent),
      status: row.status,
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      claimId: row.claim_id,
      claimItemId: row.claim_item_id,
      productName,
    };
  });

  return NextResponse.json({ credits: mapped });
}
