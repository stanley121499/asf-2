import { NextResponse } from "next/server";

import { deliveryRatesBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import {
  delyvaInstantQuote,
  getDelyvaCustomerId,
  getDelyvaOriginAddress,
  normalizeCountryForDelyva,
} from "@/app/api/_lib/delyva";
import { mapInstantQuoteServices } from "@/app/api/_lib/delyvaQuoteMappers";
import { cartWeightPayload } from "@/app/api/_lib/parcelWeight";
import { createServiceRoleClient } from "@/app/api/_lib/supabaseServiceRole";

import type { Database } from "@/database.types";

type CartRow = Database["public"]["Tables"]["add_to_carts"]["Row"];

/**
 * POST /api/delivery/rates
 *
 * Body: `{ destination, weight }` or `{ destination, userId }` — returns normalized
 * courier options from Delyva `instantQuote`. When `userId` is provided, parcel
 * weight is computed from the cart server-side (do not trust client weight).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok === false) {
    return parsedBody.response;
  }
  const validated = deliveryRatesBodySchema.safeParse(parsedBody.data);
  if (validated.success === false) {
    return validationErrorResponse(validated.error);
  }
  const { destination: dest, userId } = validated.data;
  let weight = validated.data.weight;

  if (userId !== undefined) {
    const supabase = createServiceRoleClient();
    const { data: cartRows, error: cartError } = await supabase
      .from("add_to_carts")
      .select("amount")
      .eq("user_id", userId);

    if (cartError !== null) {
      console.error("delivery/rates: cart query", cartError.message);
      return NextResponse.json({ error: "Failed to load cart" }, { status: 500 });
    }

    const rows = (cartRows ?? []) as Pick<CartRow, "amount">[];
    if (rows.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 404 });
    }
    weight = cartWeightPayload(rows);
  }

  if (weight === undefined) {
    return NextResponse.json({ error: "Weight is required" }, { status: 400 });
  }

  let origin;
  let customerId: number;
  try {
    origin = getDelyvaOriginAddress();
    customerId = getDelyvaCustomerId();
  } catch (e) {
    console.error("delivery/rates: env", e);
    return NextResponse.json({ error: "Delivery configuration error" }, { status: 500 });
  }

  const payload: Record<string, unknown> = {
    customerId,
    origin,
    destination: {
      address1: dest.address1,
      city: dest.city,
      state: dest.state,
      postcode: dest.postcode,
      country: normalizeCountryForDelyva(dest.country),
    },
    weight: { unit: "kg", value: weight.value },
    itemType: "PARCEL",
  };

  try {
    const raw = await delyvaInstantQuote(payload);
    const rates = mapInstantQuoteServices(raw);
    return NextResponse.json({ rates });
  } catch (e) {
    console.error("delivery/rates: Delyva", e);
    return NextResponse.json({ error: "Failed to fetch delivery rates" }, { status: 502 });
  }
}
