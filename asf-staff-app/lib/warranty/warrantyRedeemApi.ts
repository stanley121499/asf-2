import { apiFetch } from "@/lib/apiFetch";

/** Credit statuses returned by redeem preview / confirm. */
export type WarrantyCreditStatus = "active" | "used" | "expired" | "revoked";

/** Staff redeem preview payload from `POST /api/warranty/redeem/preview`. */
export type RedeemPreviewPayload = {
  creditId: string;
  redemptionCode: string | null;
  amountMyr: number;
  approvedPercent: number;
  status: string;
  expiresAt: string;
  redeemable: boolean;
  reasonCode: string | null;
  reasonMessage: string | null;
  customerName: string | null;
  productName: string | null;
  registrationId: string | null;
  redemptionChannel: string | null;
};

/** Voucher payload from `POST /api/warranty/redeem/confirm`. */
export type WarrantyVoucherPayload = {
  creditId: string;
  redemptionCode: string;
  amountMyr: number;
  approvedPercent: number;
  expiresAt: string;
  status: string;
  redemptionChannel: string | null;
  registrationId: string | null;
  usedAt: string | null;
};

/** Structured API failure for staff redeem routes. */
export type WarrantyRedeemApiFailure = {
  ok: false;
  error: string;
  message: string;
  httpStatus: number;
};

export type PreviewRedeemResult =
  | { ok: true; preview: RedeemPreviewPayload }
  | WarrantyRedeemApiFailure;

export type ConfirmRedeemResult =
  | { ok: true; voucher: WarrantyVoucherPayload }
  | WarrantyRedeemApiFailure;

/** Parsed staff input: typed code and/or QR JSON fields. */
export type ParsedRedemptionInput = {
  redemptionCode: string | null;
  creditId: string | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Narrows an unknown value to a plain object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

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
 * Narrows an optional nullable string field (allows explicit null).
 */
function readNullableString(value: unknown): string | null {
  if (value === null) {
    return null;
  }
  return readString(value);
}

/**
 * Normalizes a typed redemption / activation-style code for API lookup.
 * Trims, strips whitespace, and uppercases.
 *
 * @param raw - User-entered or extracted code
 * @returns Uppercase normalized code, or empty string
 */
export function normalizeRedemptionCode(raw: string): string {
  if (typeof raw !== "string") {
    return "";
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return "";
  }
  return trimmed.replace(/\s+/g, "").toUpperCase();
}

/**
 * Returns true when `value` looks like a UUID v1–v5.
 */
function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Parses staff paste/type input into redeem lookup fields.
 * Accepts a bare redemption code, or Agent 4 QR JSON:
 * `{"creditId":"…","redemptionCode":"…"}`.
 *
 * @param raw - Typed or pasted string (code or QR JSON)
 */
export function parseRedemptionInput(raw: string): ParsedRedemptionInput {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (trimmed.length === 0) {
    return { redemptionCode: null, creditId: null };
  }

  if (trimmed.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (isRecord(parsed)) {
        const codeRaw = readString(parsed["redemptionCode"]);
        const idRaw = readString(parsed["creditId"]);
        const redemptionCode =
          codeRaw !== null && normalizeRedemptionCode(codeRaw).length > 0
            ? normalizeRedemptionCode(codeRaw)
            : null;
        const creditId =
          idRaw !== null && isUuid(idRaw.trim()) ? idRaw.trim() : null;
        if (redemptionCode !== null || creditId !== null) {
          return { redemptionCode, creditId };
        }
      }
    } catch {
      // Fall through — treat as a plain code string.
    }
  }

  // Bare UUID may be a credit id pasted from support tools.
  if (isUuid(trimmed)) {
    return { redemptionCode: null, creditId: trimmed };
  }

  const asCode = normalizeRedemptionCode(trimmed);
  if (asCode.length === 0) {
    return { redemptionCode: null, creditId: null };
  }

  return { redemptionCode: asCode, creditId: null };
}

/**
 * Parses a redeem preview object from API JSON.
 */
function parsePreviewPayload(value: unknown): RedeemPreviewPayload | null {
  if (!isRecord(value)) {
    return null;
  }
  const creditId = readString(value["creditId"]);
  const amountMyr = readFiniteNumber(value["amountMyr"]);
  const approvedPercent = readFiniteNumber(value["approvedPercent"]);
  const status = readString(value["status"]);
  const expiresAt = readString(value["expiresAt"]);
  const redeemable = value["redeemable"];
  if (
    creditId === null ||
    amountMyr === null ||
    approvedPercent === null ||
    status === null ||
    expiresAt === null ||
    typeof redeemable !== "boolean"
  ) {
    return null;
  }

  return {
    creditId,
    redemptionCode: readNullableString(value["redemptionCode"]),
    amountMyr,
    approvedPercent,
    status,
    expiresAt,
    redeemable,
    reasonCode: readNullableString(value["reasonCode"]),
    reasonMessage: readNullableString(value["reasonMessage"]),
    customerName: readNullableString(value["customerName"]),
    productName: readNullableString(value["productName"]),
    registrationId: readNullableString(value["registrationId"]),
    redemptionChannel: readNullableString(value["redemptionChannel"]),
  };
}

/**
 * Parses a voucher payload from confirm API JSON.
 */
function parseVoucherPayload(value: unknown): WarrantyVoucherPayload | null {
  if (!isRecord(value)) {
    return null;
  }
  const creditId = readString(value["creditId"]);
  const redemptionCode = readString(value["redemptionCode"]);
  const amountMyr = readFiniteNumber(value["amountMyr"]);
  const approvedPercent = readFiniteNumber(value["approvedPercent"]);
  const expiresAt = readString(value["expiresAt"]);
  const status = readString(value["status"]);
  if (
    creditId === null ||
    redemptionCode === null ||
    amountMyr === null ||
    approvedPercent === null ||
    expiresAt === null ||
    status === null
  ) {
    return null;
  }

  return {
    creditId,
    redemptionCode,
    amountMyr,
    approvedPercent,
    expiresAt,
    status,
    redemptionChannel: readNullableString(value["redemptionChannel"]),
    registrationId: readNullableString(value["registrationId"]),
    usedAt: readNullableString(value["usedAt"]),
  };
}

/**
 * Maps an error JSON body into a typed failure result.
 */
function parseApiFailure(
  json: unknown,
  httpStatus: number
): WarrantyRedeemApiFailure {
  if (isRecord(json)) {
    const error = readString(json["error"]);
    const message = readString(json["message"]);
    return {
      ok: false,
      error: error ?? "INTERNAL",
      message: message ?? "Request failed",
      httpStatus,
    };
  }
  return {
    ok: false,
    error: "INTERNAL",
    message: "Request failed",
    httpStatus,
  };
}

/**
 * Staff preview: validate a voucher without burning it.
 *
 * @param params - At least one of redemptionCode or creditId
 */
export async function previewWarrantyRedeem(params: {
  redemptionCode?: string;
  creditId?: string;
}): Promise<PreviewRedeemResult> {
  const body: Record<string, string> = {};
  if (
    typeof params.redemptionCode === "string" &&
    params.redemptionCode.trim().length > 0
  ) {
    body["redemptionCode"] = normalizeRedemptionCode(params.redemptionCode);
  }
  if (typeof params.creditId === "string" && params.creditId.trim().length > 0) {
    body["creditId"] = params.creditId.trim();
  }

  if (Object.keys(body).length === 0) {
    return {
      ok: false,
      error: "CREDIT_NOT_FOUND",
      message: "请输入兑换码",
      httpStatus: 400,
    };
  }

  try {
    const res = await apiFetch("/api/warranty/redeem/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json: unknown = await res.json();
    if (!res.ok) {
      return parseApiFailure(json, res.status);
    }
    if (!isRecord(json)) {
      return {
        ok: false,
        error: "INTERNAL",
        message: "Invalid preview response",
        httpStatus: res.status,
      };
    }
    const preview = parsePreviewPayload(json["preview"]);
    if (preview === null) {
      return {
        ok: false,
        error: "INTERNAL",
        message: "Invalid preview payload",
        httpStatus: res.status,
      };
    }
    return { ok: true, preview };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return {
      ok: false,
      error: "INTERNAL",
      message,
      httpStatus: 0,
    };
  }
}

/**
 * Staff confirm: burn an active voucher in-store (single-use).
 *
 * @param params.redemptionCode - Code from preview (or typed)
 * @param params.redeemedStoreId - Active `store_locations.id`
 */
export async function confirmWarrantyRedeem(params: {
  redemptionCode: string;
  redeemedStoreId: string;
}): Promise<ConfirmRedeemResult> {
  const redemptionCode = normalizeRedemptionCode(params.redemptionCode);
  const redeemedStoreId = params.redeemedStoreId.trim();

  if (redemptionCode.length === 0) {
    return {
      ok: false,
      error: "CREDIT_NOT_FOUND",
      message: "兑换码无效",
      httpStatus: 400,
    };
  }
  if (redeemedStoreId.length === 0 || isUuid(redeemedStoreId) === false) {
    return {
      ok: false,
      error: "STORE_INVALID",
      message: "请选择核销门店",
      httpStatus: 400,
    };
  }

  try {
    const res = await apiFetch("/api/warranty/redeem/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        redemptionCode,
        redeemedStoreId,
      }),
    });
    const json: unknown = await res.json();
    if (!res.ok) {
      return parseApiFailure(json, res.status);
    }
    if (!isRecord(json)) {
      return {
        ok: false,
        error: "INTERNAL",
        message: "Invalid confirm response",
        httpStatus: res.status,
      };
    }
    const voucher = parseVoucherPayload(json["voucher"]);
    if (voucher === null) {
      return {
        ok: false,
        error: "INTERNAL",
        message: "Invalid voucher payload",
        httpStatus: res.status,
      };
    }
    return { ok: true, voucher };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return {
      ok: false,
      error: "INTERNAL",
      message,
      httpStatus: 0,
    };
  }
}

/**
 * Maps API / preview reason codes to staff-facing Chinese copy.
 *
 * @param code - Error or reason code from the API
 */
export function redeemReasonLabel(code: string | null): string {
  switch (code) {
    case "CREDIT_USED":
      return "此凭证已核销";
    case "CREDIT_EXPIRED":
      return "此凭证已过期";
    case "CREDIT_NOT_FOUND":
      return "找不到凭证";
    case "STORE_INVALID":
      return "门店无效或未启用";
    case "INELIGIBLE":
      return "此凭证不可核销";
    case "FORBIDDEN":
      return "无权限核销";
    default:
      return "无法核销";
  }
}
