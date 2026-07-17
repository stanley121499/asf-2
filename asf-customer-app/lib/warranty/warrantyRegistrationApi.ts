import { apiFetch } from "@/lib/apiFetch";
import type {
  WarrantyRedemptionChannel,
  WarrantyRegistrationStatus,
} from "@/lib/warranty/warrantyTypes";

/** Tier preview attached to list / detail / activate responses. */
export type RegistrationTierPreview = {
  daysSincePurchase: number;
  tierPercent: number | null;
  tierDaysFrom: number | null;
  tierDaysTo: number | null;
  tierFound: boolean;
  claimable: boolean;
  estimatedCreditMyr: number | null;
  maxWarrantyDays: number;
};

/** One warranty month window for month-tab browsing (Month 1–12). */
export type RegistrationPolicyTier = {
  monthIndex: number;
  daysFrom: number;
  daysTo: number;
  discountPercent: number;
  estimatedCreditMyr: number;
};

/** Customer-facing registration summary from Next warranty APIs. */
export type RegistrationSummary = {
  id: string;
  status: WarrantyRegistrationStatus;
  purchaseDate: string;
  purchaseStoreId: string;
  purchaseStoreName: string | null;
  productId: string | null;
  productName: string | null;
  productImageUrl: string | null;
  productColorId: string | null;
  productSizeId: string | null;
  originalPairPriceMyr: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  staffName: string | null;
  receiptUrl: string | null;
  warrantyCreditId: string | null;
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tier: RegistrationTierPreview;
  policyTiers: RegistrationPolicyTier[];
};

/** Body for `POST /api/warranty/registrations/activate` (camelCase). */
export type ActivateRegistrationBody = {
  code: string;
  purchaseDate: string;
  purchaseStoreId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  staffName?: string | null;
  receiptUrl?: string | null;
};

/** Structured API failure for activate / list. */
export type WarrantyRegistrationApiFailure = {
  ok: false;
  error: string;
  message: string;
  httpStatus: number;
};

export type ActivateRegistrationResult =
  | { ok: true; registration: RegistrationSummary }
  | WarrantyRegistrationApiFailure;

export type ListRegistrationsResult =
  | { ok: true; registrations: RegistrationSummary[] }
  | WarrantyRegistrationApiFailure;

/** Voucher returned after a registration claim or voucher refresh. */
export type WarrantyRegistrationVoucher = {
  creditId: string;
  redemptionCode: string;
  amountMyr: number;
  approvedPercent: number;
  expiresAt: string;
  status: "active" | "used" | "expired" | "revoked";
  redemptionChannel: WarrantyRedemptionChannel | null;
  registrationId: string | null;
  usedAt: string | null;
};

export type GetRegistrationResult =
  | { ok: true; registration: RegistrationSummary }
  | WarrantyRegistrationApiFailure;

export type ClaimRegistrationResult =
  | {
      ok: true;
      registration: RegistrationSummary;
      credit: WarrantyRegistrationVoucher;
    }
  | WarrantyRegistrationApiFailure;

export type GetVoucherResult =
  | { ok: true; voucher: WarrantyRegistrationVoucher }
  | WarrantyRegistrationApiFailure;

const REGISTRATION_STATUSES: ReadonlySet<string> = new Set([
  "active",
  "claimed",
  "expired",
  "void",
]);

const VOUCHER_STATUSES: ReadonlySet<string> = new Set([
  "active",
  "used",
  "expired",
  "revoked",
]);

/**
 * Narrows an unknown value to a finite number, or null when invalid.
 */
function readFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}

/**
 * Narrows an unknown value to a string, or null when not a string.
 */
function readString(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }
  return null;
}

/**
 * Parses the tier preview object from a RegistrationSummary payload.
 */
function parseTierPreview(value: unknown): RegistrationTierPreview | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const daysSincePurchase = readFiniteNumber(row["daysSincePurchase"]);
  const maxWarrantyDays = readFiniteNumber(row["maxWarrantyDays"]);
  if (daysSincePurchase === null || maxWarrantyDays === null) {
    return null;
  }
  const tierPercentRaw = row["tierPercent"];
  const tierPercent =
    tierPercentRaw === null ? null : readFiniteNumber(tierPercentRaw);
  const tierDaysFromRaw = row["tierDaysFrom"];
  const tierDaysFrom =
    tierDaysFromRaw === null ? null : readFiniteNumber(tierDaysFromRaw);
  const tierDaysToRaw = row["tierDaysTo"];
  const tierDaysTo =
    tierDaysToRaw === null ? null : readFiniteNumber(tierDaysToRaw);
  const estimatedRaw = row["estimatedCreditMyr"];
  const estimatedCreditMyr =
    estimatedRaw === null ? null : readFiniteNumber(estimatedRaw);
  const tierFound = row["tierFound"] === true;
  const claimable = row["claimable"] === true;
  return {
    daysSincePurchase,
    tierPercent,
    tierDaysFrom,
    tierDaysTo,
    tierFound,
    claimable,
    estimatedCreditMyr,
    maxWarrantyDays,
  };
}

/**
 * Parses one policy tier row used by month tabs.
 */
function parsePolicyTier(value: unknown): RegistrationPolicyTier | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const monthIndex = readFiniteNumber(row["monthIndex"]);
  const daysFrom = readFiniteNumber(row["daysFrom"]);
  const daysTo = readFiniteNumber(row["daysTo"]);
  const discountPercent = readFiniteNumber(row["discountPercent"]);
  const estimatedCreditMyr = readFiniteNumber(row["estimatedCreditMyr"]);
  if (
    monthIndex === null ||
    daysFrom === null ||
    daysTo === null ||
    discountPercent === null ||
    estimatedCreditMyr === null
  ) {
    return null;
  }
  return {
    monthIndex,
    daysFrom,
    daysTo,
    discountPercent,
    estimatedCreditMyr,
  };
}

/**
 * Parses the policyTiers array; missing/invalid entries become an empty list.
 */
function parsePolicyTiers(value: unknown): RegistrationPolicyTier[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const tiers: RegistrationPolicyTier[] = [];
  for (const item of value) {
    const parsed = parsePolicyTier(item);
    if (parsed !== null) {
      tiers.push(parsed);
    }
  }
  return tiers.sort((a, b) => a.monthIndex - b.monthIndex);
}

/**
 * Parses one RegistrationSummary from an unknown JSON value.
 */
export function parseRegistrationSummary(value: unknown): RegistrationSummary | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const id = readString(row["id"]);
  const statusRaw = readString(row["status"]);
  const purchaseDate = readString(row["purchaseDate"]);
  const purchaseStoreId = readString(row["purchaseStoreId"]);
  const customerName = readString(row["customerName"]);
  const customerEmail = readString(row["customerEmail"]);
  const customerPhone = readString(row["customerPhone"]);
  const createdAt = readString(row["createdAt"]);
  const updatedAt = readString(row["updatedAt"]);
  const originalPairPriceMyr = readFiniteNumber(row["originalPairPriceMyr"]);
  const tier = parseTierPreview(row["tier"]);

  if (
    id === null ||
    statusRaw === null ||
    !REGISTRATION_STATUSES.has(statusRaw) ||
    purchaseDate === null ||
    purchaseStoreId === null ||
    customerName === null ||
    customerEmail === null ||
    customerPhone === null ||
    createdAt === null ||
    updatedAt === null ||
    originalPairPriceMyr === null ||
    tier === null
  ) {
    return null;
  }

  const status = statusRaw as WarrantyRegistrationStatus;
  const productImageRaw = readString(row["productImageUrl"]);
  const productImageUrl =
    productImageRaw !== null && productImageRaw.trim().length > 0
      ? productImageRaw.trim()
      : null;

  return {
    id,
    status,
    purchaseDate,
    purchaseStoreId,
    purchaseStoreName: readString(row["purchaseStoreName"]),
    productId: readString(row["productId"]),
    productName: readString(row["productName"]),
    productImageUrl,
    productColorId: readString(row["productColorId"]),
    productSizeId: readString(row["productSizeId"]),
    originalPairPriceMyr,
    customerName,
    customerEmail,
    customerPhone,
    staffName: readString(row["staffName"]),
    receiptUrl: readString(row["receiptUrl"]),
    warrantyCreditId: readString(row["warrantyCreditId"]),
    claimedAt: readString(row["claimedAt"]),
    createdAt,
    updatedAt,
    tier,
    policyTiers: parsePolicyTiers(row["policyTiers"]),
  };
}

/**
 * Parses a customer voucher payload from an unknown API response.
 */
export function parseWarrantyRegistrationVoucher(
  value: unknown
): WarrantyRegistrationVoucher | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const creditId = readString(row["creditId"]);
  const redemptionCode = readString(row["redemptionCode"]);
  const amountMyr = readFiniteNumber(row["amountMyr"]);
  const approvedPercent = readFiniteNumber(row["approvedPercent"]);
  const expiresAt = readString(row["expiresAt"]);
  const statusRaw = readString(row["status"]);
  const redemptionChannelRaw = row["redemptionChannel"];
  const redemptionChannel =
    redemptionChannelRaw === "online" || redemptionChannelRaw === "in_store"
      ? redemptionChannelRaw
      : null;

  if (
    creditId === null ||
    redemptionCode === null ||
    amountMyr === null ||
    approvedPercent === null ||
    expiresAt === null ||
    statusRaw === null ||
    !VOUCHER_STATUSES.has(statusRaw)
  ) {
    return null;
  }

  const status = statusRaw as WarrantyRegistrationVoucher["status"];
  return {
    creditId,
    redemptionCode,
    amountMyr,
    approvedPercent,
    expiresAt,
    status,
    redemptionChannel,
    registrationId: readString(row["registrationId"]),
    usedAt: readString(row["usedAt"]),
  };
}

/**
 * Reads `{ error, message }` from a failed API JSON body.
 */
function parseApiFailure(
  json: unknown,
  httpStatus: number,
  fallbackMessage: string
): WarrantyRegistrationApiFailure {
  if (typeof json !== "object" || json === null) {
    return {
      ok: false,
      error: "INTERNAL",
      message: fallbackMessage,
      httpStatus,
    };
  }
  const row = json as Record<string, unknown>;
  const error = readString(row["error"]) ?? "INTERNAL";
  const message = readString(row["message"]) ?? fallbackMessage;
  return { ok: false, error, message, httpStatus };
}

/**
 * POST `/api/warranty/registrations/activate` — burns a one-time card code.
 * Never writes activation codes or credits from the client.
 */
export async function activateWarrantyRegistration(
  body: ActivateRegistrationBody
): Promise<ActivateRegistrationResult> {
  let response: Response;
  try {
    response = await apiFetch("/api/warranty/registrations/activate", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Network error while activating.";
    return { ok: false, error: "INTERNAL", message, httpStatus: 0 };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return {
      ok: false,
      error: "INTERNAL",
      message: "Invalid response from activate.",
      httpStatus: response.status,
    };
  }

  if (!response.ok) {
    return parseApiFailure(json, response.status, "Could not activate warranty card.");
  }

  if (typeof json !== "object" || json === null) {
    return {
      ok: false,
      error: "INTERNAL",
      message: "Invalid response from activate.",
      httpStatus: response.status,
    };
  }

  const registration = parseRegistrationSummary(
    (json as Record<string, unknown>)["registration"]
  );
  if (registration === null) {
    return {
      ok: false,
      error: "INTERNAL",
      message: "Invalid registration payload from activate.",
      httpStatus: response.status,
    };
  }

  return { ok: true, registration };
}

/**
 * GET `/api/warranty/registrations` — lists the signed-in customer's registrations.
 */
export async function listWarrantyRegistrations(): Promise<ListRegistrationsResult> {
  let response: Response;
  try {
    response = await apiFetch("/api/warranty/registrations", { method: "GET" });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Network error while loading collection.";
    return { ok: false, error: "INTERNAL", message, httpStatus: 0 };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return {
      ok: false,
      error: "INTERNAL",
      message: "Invalid response from registrations list.",
      httpStatus: response.status,
    };
  }

  if (!response.ok) {
    return parseApiFailure(json, response.status, "Could not load My Collection.");
  }

  if (typeof json !== "object" || json === null) {
    return {
      ok: false,
      error: "INTERNAL",
      message: "Invalid response from registrations list.",
      httpStatus: response.status,
    };
  }

  const rawList = (json as Record<string, unknown>)["registrations"];
  if (!Array.isArray(rawList)) {
    return {
      ok: false,
      error: "INTERNAL",
      message: "Invalid registrations array.",
      httpStatus: response.status,
    };
  }

  const registrations: RegistrationSummary[] = [];
  for (const item of rawList) {
    const parsed = parseRegistrationSummary(item);
    if (parsed !== null) {
      registrations.push(parsed);
    }
  }

  return { ok: true, registrations };
}

/**
 * GET `/api/warranty/registrations/[id]` — loads one owned registration.
 */
export async function getWarrantyRegistration(
  registrationId: string
): Promise<GetRegistrationResult> {
  let response: Response;
  try {
    response = await apiFetch(
      `/api/warranty/registrations/${encodeURIComponent(registrationId)}`,
      { method: "GET" }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Network error while loading registration.";
    return { ok: false, error: "INTERNAL", message, httpStatus: 0 };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return {
      ok: false,
      error: "INTERNAL",
      message: "Invalid registration detail response.",
      httpStatus: response.status,
    };
  }
  if (!response.ok) {
    return parseApiFailure(json, response.status, "Could not load registration.");
  }
  if (typeof json !== "object" || json === null) {
    return {
      ok: false,
      error: "INTERNAL",
      message: "Invalid registration detail response.",
      httpStatus: response.status,
    };
  }
  const registration = parseRegistrationSummary(
    (json as Record<string, unknown>)["registration"]
  );
  if (registration === null) {
    return {
      ok: false,
      error: "INTERNAL",
      message: "Invalid registration payload.",
      httpStatus: response.status,
    };
  }
  return { ok: true, registration };
}

/**
 * POST `/api/warranty/registrations/[id]/claim` — claims exactly once.
 * The server computes and returns the authoritative percent and RM amount.
 */
export async function claimWarrantyRegistration(
  registrationId: string
): Promise<ClaimRegistrationResult> {
  let response: Response;
  try {
    response = await apiFetch(
      `/api/warranty/registrations/${encodeURIComponent(registrationId)}/claim`,
      { method: "POST" }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Network error while claiming offer.";
    return { ok: false, error: "INTERNAL", message, httpStatus: 0 };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return {
      ok: false,
      error: "INTERNAL",
      message: "Invalid claim response.",
      httpStatus: response.status,
    };
  }
  if (!response.ok) {
    return parseApiFailure(json, response.status, "Could not claim this offer.");
  }
  if (typeof json !== "object" || json === null) {
    return {
      ok: false,
      error: "INTERNAL",
      message: "Invalid claim response.",
      httpStatus: response.status,
    };
  }
  const row = json as Record<string, unknown>;
  const registration = parseRegistrationSummary(row["registration"]);
  const credit = parseWarrantyRegistrationVoucher(row["credit"]);
  if (registration === null || credit === null) {
    return {
      ok: false,
      error: "INTERNAL",
      message: "Invalid claim payload.",
      httpStatus: response.status,
    };
  }
  return { ok: true, registration, credit };
}

/**
 * GET `/api/warranty/credits/[id]/voucher` — loads an owned voucher.
 */
export async function getWarrantyRegistrationVoucher(
  creditId: string
): Promise<GetVoucherResult> {
  let response: Response;
  try {
    response = await apiFetch(
      `/api/warranty/credits/${encodeURIComponent(creditId)}/voucher`,
      { method: "GET" }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Network error while loading voucher.";
    return { ok: false, error: "INTERNAL", message, httpStatus: 0 };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return {
      ok: false,
      error: "INTERNAL",
      message: "Invalid voucher response.",
      httpStatus: response.status,
    };
  }
  if (!response.ok) {
    return parseApiFailure(json, response.status, "Could not load voucher.");
  }
  if (typeof json !== "object" || json === null) {
    return {
      ok: false,
      error: "INTERNAL",
      message: "Invalid voucher response.",
      httpStatus: response.status,
    };
  }
  const voucher = parseWarrantyRegistrationVoucher(
    (json as Record<string, unknown>)["voucher"]
  );
  if (voucher === null) {
    return {
      ok: false,
      error: "INTERNAL",
      message: "Invalid voucher payload.",
      httpStatus: response.status,
    };
  }
  return { ok: true, voucher };
}
