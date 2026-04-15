import { NextResponse } from "next/server";

import { delyvaInstantQuote, getDelyvaCustomerId, getDelyvaOriginAddress } from "@/app/api/_lib/delyva";
import { mapInstantQuoteServices } from "@/app/api/_lib/delyvaQuoteMappers";

type DestinationInput = {
  address1: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
};

type WeightInput = { unit: "kg"; value: number };

function isDestination(value: unknown): value is DestinationInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    typeof o.address1 === "string" &&
    typeof o.city === "string" &&
    typeof o.state === "string" &&
    typeof o.postcode === "string" &&
    typeof o.country === "string"
  );
}

function isWeight(value: unknown): value is WeightInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const o = value as Record<string, unknown>;
  return o.unit === "kg" && typeof o.value === "number" && Number.isFinite(o.value) && o.value > 0;
}

/**
 * POST /api/delivery/rates
 *
 * Body: `{ destination, weight }` — returns normalized courier options from Delyva `instantQuote`.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }
  const dest = (body as { destination?: unknown }).destination;
  const weight = (body as { weight?: unknown }).weight;
  if (!isDestination(dest)) {
    return NextResponse.json(
      { error: "destination must include address1, city, state, postcode, country" },
      { status: 400 },
    );
  }
  if (!isWeight(weight)) {
    return NextResponse.json({ error: "weight must be { unit: \"kg\", value: positive number }" }, { status: 400 });
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
