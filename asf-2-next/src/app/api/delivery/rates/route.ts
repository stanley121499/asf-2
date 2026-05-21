import { NextResponse } from "next/server";

import { deliveryRatesBodySchema } from "@/app/api/_lib/apiSchemas";
import { parseJsonBody, validationErrorResponse } from "@/app/api/_lib/apiJson";
import { delyvaInstantQuote, getDelyvaCustomerId, getDelyvaOriginAddress } from "@/app/api/_lib/delyva";
import { mapInstantQuoteServices } from "@/app/api/_lib/delyvaQuoteMappers";

/**
 * POST /api/delivery/rates
 *
 * Body: `{ destination, weight }` — returns normalized courier options from Delyva `instantQuote`.
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
  const { destination: dest, weight } = validated.data;

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
      country: dest.country,
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
