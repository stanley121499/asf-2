const DELYVA_BASE = "https://api.delyva.app/v1.0";

export type DelyvaWeight = { unit: "kg"; value: number };

export type DelyvaAddress = {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
};

/**
 * Reads Delyva API key from the environment (X-Delyvax-Access-Token).
 */
export function getDelyvaAccessToken(): string {
  const key = process.env.DELYVA_API_KEY;
  if (key === undefined || key.length === 0) {
    throw new Error("Missing DELYVA_API_KEY");
  }
  return key;
}

/**
 * Parses DELYVA_CUSTOMER_ID as a positive integer (Delyva `customerId` field).
 */
export function getDelyvaCustomerId(): number {
  const raw = process.env.DELYVA_CUSTOMER_ID;
  if (raw === undefined || raw.length === 0) {
    throw new Error("Missing DELYVA_CUSTOMER_ID");
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Invalid DELYVA_CUSTOMER_ID");
  }
  return n;
}

/**
 * Parses JSON env `DELYVA_ORIGIN_ADDRESS` into a Delyva address object.
 */
export function getDelyvaOriginAddress(): DelyvaAddress {
  const raw = process.env.DELYVA_ORIGIN_ADDRESS;
  if (raw === undefined || raw.length === 0) {
    throw new Error("Missing DELYVA_ORIGIN_ADDRESS");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("DELYVA_ORIGIN_ADDRESS must be valid JSON");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("DELYVA_ORIGIN_ADDRESS must be a JSON object");
  }
  const o = parsed as Record<string, unknown>;
  const address1 = o.address1;
  const city = o.city;
  const state = o.state;
  const postcode = o.postcode;
  const country = o.country;
  if (
    typeof address1 !== "string" ||
    typeof city !== "string" ||
    typeof state !== "string" ||
    typeof postcode !== "string" ||
    typeof country !== "string"
  ) {
    throw new Error("DELYVA_ORIGIN_ADDRESS requires address1, city, state, postcode, country strings");
  }
  const address2 = o.address2;
  return {
    address1,
    address2: typeof address2 === "string" ? address2 : undefined,
    city,
    state,
    postcode,
    country,
  };
}

function delyvaHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Delyvax-Access-Token": getDelyvaAccessToken(),
  };
}

/**
 * POST `${base}/service/instantQuote` — returns parsed JSON or throws with status text.
 */
export async function delyvaInstantQuote(body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${DELYVA_BASE}/service/instantQuote`, {
    method: "POST",
    headers: delyvaHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text.length > 0 ? (JSON.parse(text) as unknown) : null;
  } catch {
    throw new Error(`Delyva instantQuote: non-JSON response (${res.status})`);
  }
  if (!res.ok) {
    const msg = typeof data === "object" && data !== null && "message" in data
      ? String((data as { message?: unknown }).message)
      : text;
    throw new Error(`Delyva instantQuote failed (${res.status}): ${msg}`);
  }
  return data;
}

/**
 * POST `/order` — create draft or processed shipment order.
 */
export async function delyvaCreateOrder(body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${DELYVA_BASE}/order`, {
    method: "POST",
    headers: delyvaHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text.length > 0 ? (JSON.parse(text) as unknown) : null;
  } catch {
    throw new Error(`Delyva create order: non-JSON response (${res.status})`);
  }
  if (!res.ok) {
    const msg = typeof data === "object" && data !== null && "message" in data
      ? String((data as { message?: unknown }).message)
      : text;
    throw new Error(`Delyva create order failed (${res.status}): ${msg}`);
  }
  return data;
}

/**
 * POST `/order/{id}/process` — confirm a draft order.
 */
export async function delyvaProcessOrder(
  delyvaNumericId: number,
  body: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch(`${DELYVA_BASE}/order/${delyvaNumericId}/process`, {
    method: "POST",
    headers: delyvaHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text.length > 0 ? (JSON.parse(text) as unknown) : null;
  } catch {
    throw new Error(`Delyva process order: non-JSON response (${res.status})`);
  }
  if (!res.ok) {
    const msg = typeof data === "object" && data !== null && "message" in data
      ? String((data as { message?: unknown }).message)
      : text;
    throw new Error(`Delyva process order failed (${res.status}): ${msg}`);
  }
  return data;
}

/**
 * GET `/order/{id}` — order details (tracking, status).
 */
export async function delyvaGetOrder(delyvaNumericId: number): Promise<unknown> {
  const res = await fetch(`${DELYVA_BASE}/order/${delyvaNumericId}`, {
    method: "GET",
    headers: delyvaHeaders(),
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text.length > 0 ? (JSON.parse(text) as unknown) : null;
  } catch {
    throw new Error(`Delyva get order: non-JSON response (${res.status})`);
  }
  if (!res.ok) {
    const msg = typeof data === "object" && data !== null && "message" in data
      ? String((data as { message?: unknown }).message)
      : text;
    throw new Error(`Delyva get order failed (${res.status}): ${msg}`);
  }
  return data;
}

/**
 * GET `/order/{id}/label` — shipping label URL (JSON or redirect).
 */
export async function delyvaGetLabelUrl(delyvaNumericId: number): Promise<string> {
  const res = await fetch(`${DELYVA_BASE}/order/${delyvaNumericId}/label`, {
    method: "GET",
    headers: delyvaHeaders(),
    redirect: "manual",
  });
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get("Location");
    if (loc !== null && loc.length > 0) {
      return loc;
    }
  }
  const text = await res.text();
  let data: unknown;
  try {
    data = text.length > 0 ? (JSON.parse(text) as unknown) : null;
  } catch {
    if (res.ok && text.startsWith("http")) {
      return text.trim();
    }
    throw new Error(`Delyva label: non-JSON response (${res.status})`);
  }
  if (typeof data === "object" && data !== null && "url" in data && typeof (data as { url: unknown }).url === "string") {
    return (data as { url: string }).url;
  }
  if (typeof data === "object" && data !== null && "data" in data && typeof (data as { data: unknown }).data === "string") {
    return (data as { data: string }).data;
  }
  if (!res.ok) {
    throw new Error(`Delyva label failed (${res.status}): ${text}`);
  }
  throw new Error("Delyva label: could not resolve label URL from response");
}

/**
 * Formats a Date for Delyva `scheduledAt` fields (`Asia/Kuala_Lumpur`, `+0800`).
 */
export function formatDelyvaScheduledMalaysia(date: Date): string {
  const s = date.toLocaleString("sv-SE", { timeZone: "Asia/Kuala_Lumpur" });
  const parts = s.split(" ");
  if (parts.length < 2) {
    return `${s}+0800`;
  }
  return `${parts[0]}T${parts[1]}+0800`;
}
