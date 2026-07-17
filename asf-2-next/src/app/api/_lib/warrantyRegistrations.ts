import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables, TablesInsert } from "@/database.types";
import { calculateCreditAmount } from "@/modules/warranty/calculateCreditAmount";
import { daysSincePurchase } from "@/modules/warranty/daysSincePurchase";
import { generateRedemptionCode } from "@/modules/warranty/generateRedemptionCode";
import { loadWarrantyPolicyOrDefault } from "@/modules/warranty/loadWarrantyPolicy";
import { normalizeActivationCode } from "@/modules/warranty/normalizeActivationCode";
import { resolveWarrantyTier } from "@/modules/warranty/resolveWarrantyTier";
import type { WarrantyRegistrationStatus } from "@/modules/warranty/warrantyTypes";

type ServiceClient = SupabaseClient<Database>;

/** Stable API error codes for physical warranty registration / redeem. */
export type WarrantyRegistrationErrorCode =
  | "CODE_INVALID"
  | "CODE_USED"
  | "ALREADY_CLAIMED"
  | "INELIGIBLE"
  | "CREDIT_USED"
  | "CREDIT_EXPIRED"
  | "CREDIT_NOT_FOUND"
  | "STORE_INVALID"
  | "PRODUCT_PRICE_MISSING"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INTERNAL";

export type WarrantyRegistrationApiError = {
  ok: false;
  code: WarrantyRegistrationErrorCode;
  message: string;
  httpStatus: number;
};

/** Computed tier preview attached to list/detail responses. */
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

/** One warranty month window for month-tab UI (Month 1–12, sorted by monthIndex). */
export type RegistrationPolicyTier = {
  monthIndex: number;
  daysFrom: number;
  daysTo: number;
  discountPercent: number;
  estimatedCreditMyr: number;
};

/** Public registration payload for customer apps. */
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

/** Voucher payload for QR display. */
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

/** Staff redeem preview payload. */
export type RedeemPreviewPayload = {
  creditId: string;
  redemptionCode: string | null;
  amountMyr: number;
  approvedPercent: number;
  status: string;
  expiresAt: string;
  redeemable: boolean;
  reasonCode: WarrantyRegistrationErrorCode | null;
  reasonMessage: string | null;
  customerName: string | null;
  productName: string | null;
  registrationId: string | null;
  redemptionChannel: string | null;
};

const MAX_REDEMPTION_CODE_ATTEMPTS = 8;

/**
 * Maps a registration row + joins into the public summary shape with tier preview.
 */
export function buildRegistrationSummary(
  row: Tables<"warranty_registrations">,
  options: {
    productName: string | null;
    productImageUrl: string | null;
    storeName: string | null;
    maxWarrantyDays: number;
    tiers: readonly {
      days_from: number;
      days_to: number;
      discount_percent: number;
      sort_order: number;
    }[];
    now?: Date;
  }
): RegistrationSummary {
  const now = options.now ?? new Date();
  const days = daysSincePurchase(row.purchase_date, now);
  const price = Number(row.original_pair_price_myr);
  const status = parseRegistrationStatus(row.status);

  let tierPercent: number | null = null;
  let tierDaysFrom: number | null = null;
  let tierDaysTo: number | null = null;
  let tierFound = false;
  let claimable = false;
  let estimatedCreditMyr: number | null = null;

  if (Number.isFinite(days) && days >= 0) {
    const resolved = resolveWarrantyTier(days, options.tiers, options.maxWarrantyDays);
    tierFound = resolved.tierFound;
    if (resolved.tierFound) {
      tierPercent = resolved.discountPercent;
      estimatedCreditMyr = calculateCreditAmount(price, resolved.discountPercent);
      const currentTier = options.tiers.find(
        (tier) => days >= tier.days_from && days <= tier.days_to
      );
      if (currentTier !== undefined) {
        tierDaysFrom = currentTier.days_from;
        tierDaysTo = Math.min(currentTier.days_to, options.maxWarrantyDays);
      }
    }
    claimable = status === "active" && resolved.tierFound;
  }

  return {
    id: row.id,
    status,
    purchaseDate: row.purchase_date,
    purchaseStoreId: row.purchase_store_id,
    purchaseStoreName: options.storeName,
    productId: row.product_id,
    productName: options.productName,
    productImageUrl: options.productImageUrl,
    productColorId: row.product_color_id,
    productSizeId: row.product_size_id,
    originalPairPriceMyr: price,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    staffName: row.staff_name,
    receiptUrl: row.receipt_url,
    warrantyCreditId: row.warranty_credit_id,
    claimedAt: row.claimed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tier: {
      daysSincePurchase: Number.isFinite(days) ? days : Number.NaN,
      tierPercent,
      tierDaysFrom,
      tierDaysTo,
      tierFound,
      claimable,
      estimatedCreditMyr,
      maxWarrantyDays: options.maxWarrantyDays,
    },
    policyTiers: buildPolicyTiers(
      price,
      options.tiers,
      options.maxWarrantyDays,
      row.purchase_date
    ),
  };
}

/**
 * Activates an unused card code and creates a warranty registration for the user.
 */
export async function activateWarrantyRegistration(
  supabase: ServiceClient,
  params: {
    userId: string;
    code: string;
    purchaseDate: string;
    purchaseStoreId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    staffName?: string | null;
    receiptUrl?: string | null;
  }
): Promise<{ ok: true; registration: RegistrationSummary } | WarrantyRegistrationApiError> {
  const normalizedCode = normalizeActivationCode(params.code);
  if (normalizedCode.length === 0) {
    return {
      ok: false,
      code: "CODE_INVALID",
      message: "Activation code is invalid",
      httpStatus: 400,
    };
  }

  const days = daysSincePurchase(params.purchaseDate);
  if (Number.isNaN(days)) {
    return {
      ok: false,
      code: "INELIGIBLE",
      message: "purchaseDate is invalid",
      httpStatus: 400,
    };
  }
  if (days < 0) {
    return {
      ok: false,
      code: "INELIGIBLE",
      message: "purchaseDate cannot be in the future",
      httpStatus: 400,
    };
  }

  const { data: store, error: storeError } = await supabase
    .from("store_locations")
    .select("id, name, active")
    .eq("id", params.purchaseStoreId)
    .maybeSingle();

  if (storeError !== null) {
    console.error("activateWarrantyRegistration: store", storeError.message);
    return {
      ok: false,
      code: "INTERNAL",
      message: "Could not validate purchase store",
      httpStatus: 500,
    };
  }

  if (store === null || store.active !== true) {
    return {
      ok: false,
      code: "STORE_INVALID",
      message: "Purchase store is invalid or inactive",
      httpStatus: 400,
    };
  }

  const { data: activationCode, error: codeError } = await supabase
    .from("warranty_activation_codes")
    .select("*")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (codeError !== null) {
    console.error("activateWarrantyRegistration: code lookup", codeError.message);
    return {
      ok: false,
      code: "INTERNAL",
      message: "Could not validate activation code",
      httpStatus: 500,
    };
  }

  if (activationCode === null) {
    return {
      ok: false,
      code: "CODE_INVALID",
      message: "Activation code not found",
      httpStatus: 404,
    };
  }

  if (activationCode.status !== "unused") {
    return {
      ok: false,
      code: "CODE_USED",
      message: "Activation code has already been used",
      httpStatus: 409,
    };
  }

  if (activationCode.product_id === null) {
    return {
      ok: false,
      code: "PRODUCT_PRICE_MISSING",
      message: "Activation code is not linked to a product",
      httpStatus: 400,
    };
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, price, product_medias(media_url, arrangement)")
    .eq("id", activationCode.product_id)
    .maybeSingle();

  if (productError !== null) {
    console.error("activateWarrantyRegistration: product", productError.message);
    return {
      ok: false,
      code: "INTERNAL",
      message: "Could not load product price",
      httpStatus: 500,
    };
  }

  if (product === null) {
    return {
      ok: false,
      code: "PRODUCT_PRICE_MISSING",
      message: "Product linked to activation code was not found",
      httpStatus: 400,
    };
  }

  const productPrice = Number(product.price);
  if (!Number.isFinite(productPrice) || productPrice <= 0) {
    return {
      ok: false,
      code: "PRODUCT_PRICE_MISSING",
      message: "Product price is missing or invalid",
      httpStatus: 400,
    };
  }

  const policyBundle = await loadWarrantyPolicyOrDefault(supabase);
  const policyId =
    policyBundle.policy.id !== "default" ? policyBundle.policy.id : null;

  const registrationInsert: TablesInsert<"warranty_registrations"> = {
    user_id: params.userId,
    activation_code_id: activationCode.id,
    product_id: activationCode.product_id,
    product_color_id: activationCode.product_color_id,
    product_size_id: activationCode.product_size_id,
    purchase_date: params.purchaseDate,
    purchase_store_id: params.purchaseStoreId,
    customer_name: params.customerName,
    customer_email: params.customerEmail,
    customer_phone: params.customerPhone,
    staff_name:
      typeof params.staffName === "string" && params.staffName.trim().length > 0
        ? params.staffName.trim()
        : null,
    receipt_url:
      typeof params.receiptUrl === "string" && params.receiptUrl.trim().length > 0
        ? params.receiptUrl.trim()
        : null,
    original_pair_price_myr: productPrice,
    policy_id: policyId,
    status: "active",
  };

  const { data: registration, error: insertError } = await supabase
    .from("warranty_registrations")
    .insert(registrationInsert)
    .select("*")
    .single();

  if (insertError !== null || registration === null) {
    // Unique violation on activation_code_id means a concurrent activate won.
    if (insertError !== null && insertError.code === "23505") {
      return {
        ok: false,
        code: "CODE_USED",
        message: "Activation code has already been used",
        httpStatus: 409,
      };
    }
    console.error("activateWarrantyRegistration: insert", insertError?.message);
    return {
      ok: false,
      code: "INTERNAL",
      message: insertError?.message ?? "Failed to create registration",
      httpStatus: 500,
    };
  }

  const nowIso = new Date().toISOString();
  const { data: burnedCode, error: burnError } = await supabase
    .from("warranty_activation_codes")
    .update({
      status: "used",
      used_at: nowIso,
      used_by_user_id: params.userId,
      registration_id: registration.id,
    })
    .eq("id", activationCode.id)
    .eq("status", "unused")
    .select("id")
    .maybeSingle();

  if (burnError !== null || burnedCode === null) {
    // Roll back orphan registration if code burn lost the race.
    await supabase.from("warranty_registrations").delete().eq("id", registration.id);
    console.error(
      "activateWarrantyRegistration: burn code",
      burnError?.message ?? "no rows updated"
    );
    return {
      ok: false,
      code: "CODE_USED",
      message: "Activation code has already been used",
      httpStatus: 409,
    };
  }

  return {
    ok: true,
    registration: buildRegistrationSummary(registration, {
      productName: product.name,
      productImageUrl: extractPrimaryProductImageUrl(product),
      storeName: store.name,
      maxWarrantyDays: policyBundle.policy.max_warranty_days,
      tiers: policyBundle.tiers,
    }),
  };
}

/**
 * Lists registrations owned by the authenticated customer with tier previews.
 */
export async function listWarrantyRegistrationsForUser(
  supabase: ServiceClient,
  userId: string
): Promise<{ ok: true; registrations: RegistrationSummary[] } | WarrantyRegistrationApiError> {
  const { data: rows, error } = await supabase
    .from("warranty_registrations")
    .select(
      `
      *,
      products ( name, product_medias ( media_url, arrangement ) ),
      store_locations ( name )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error !== null) {
    console.error("listWarrantyRegistrationsForUser", error.message);
    return {
      ok: false,
      code: "INTERNAL",
      message: "Failed to load registrations",
      httpStatus: 500,
    };
  }

  const policyBundle = await loadWarrantyPolicyOrDefault(supabase);
  const registrations = (rows ?? []).map((row) => {
    const productName = extractJoinedName(row.products);
    const productImageUrl = extractPrimaryProductImageUrl(row.products);
    const storeName = extractJoinedName(row.store_locations);
    const { products: _p, store_locations: _s, ...registrationRow } = row;
    return buildRegistrationSummary(registrationRow, {
      productName,
      productImageUrl,
      storeName,
      maxWarrantyDays: policyBundle.policy.max_warranty_days,
      tiers: policyBundle.tiers,
    });
  });

  return { ok: true, registrations };
}

/**
 * Loads one registration owned by the user, or NOT_FOUND / FORBIDDEN.
 */
export async function getWarrantyRegistrationForUser(
  supabase: ServiceClient,
  userId: string,
  registrationId: string
): Promise<{ ok: true; registration: RegistrationSummary } | WarrantyRegistrationApiError> {
  const { data: row, error } = await supabase
    .from("warranty_registrations")
    .select(
      `
      *,
      products ( name, product_medias ( media_url, arrangement ) ),
      store_locations ( name )
    `
    )
    .eq("id", registrationId)
    .maybeSingle();

  if (error !== null) {
    console.error("getWarrantyRegistrationForUser", error.message);
    return {
      ok: false,
      code: "INTERNAL",
      message: "Failed to load registration",
      httpStatus: 500,
    };
  }

  if (row === null) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Registration not found",
      httpStatus: 404,
    };
  }

  if (row.user_id !== userId) {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Registration does not belong to this account",
      httpStatus: 403,
    };
  }

  const policyBundle = await loadWarrantyPolicyOrDefault(supabase);
  const productName = extractJoinedName(row.products);
  const productImageUrl = extractPrimaryProductImageUrl(row.products);
  const storeName = extractJoinedName(row.store_locations);
  const { products: _p, store_locations: _s, ...registrationRow } = row;

  return {
    ok: true,
    registration: buildRegistrationSummary(registrationRow, {
      productName,
      productImageUrl,
      storeName,
      maxWarrantyDays: policyBundle.policy.max_warranty_days,
      tiers: policyBundle.tiers,
    }),
  };
}

/**
 * One-time claim: issues a fixed-RM warranty credit at the current tier.
 * Never trusts client-sent amount or percent.
 */
export async function claimWarrantyRegistration(
  supabase: ServiceClient,
  params: { userId: string; registrationId: string }
): Promise<
  | {
      ok: true;
      registration: RegistrationSummary;
      credit: WarrantyVoucherPayload;
    }
  | WarrantyRegistrationApiError
> {
  const loaded = await getWarrantyRegistrationForUser(
    supabase,
    params.userId,
    params.registrationId
  );
  if (loaded.ok === false) {
    return loaded;
  }

  const summary = loaded.registration;

  if (summary.status === "claimed" || summary.warrantyCreditId !== null) {
    return {
      ok: false,
      code: "ALREADY_CLAIMED",
      message: "This registration has already been claimed",
      httpStatus: 409,
    };
  }

  if (summary.status !== "active") {
    return {
      ok: false,
      code: "INELIGIBLE",
      message: "Registration is not eligible to claim",
      httpStatus: 400,
    };
  }

  if (summary.tier.claimable !== true || summary.tier.tierFound !== true) {
    return {
      ok: false,
      code: "INELIGIBLE",
      message: "No warranty tier applies for the current days since purchase",
      httpStatus: 400,
    };
  }

  const days = summary.tier.daysSincePurchase;
  if (!Number.isFinite(days) || days < 0) {
    return {
      ok: false,
      code: "INELIGIBLE",
      message: "Invalid purchase date on registration",
      httpStatus: 400,
    };
  }

  const policyBundle = await loadWarrantyPolicyOrDefault(supabase);
  const resolved = resolveWarrantyTier(
    days,
    policyBundle.tiers,
    policyBundle.policy.max_warranty_days
  );

  if (resolved.tierFound !== true) {
    return {
      ok: false,
      code: "INELIGIBLE",
      message: "No warranty tier applies for the current days since purchase",
      httpStatus: 400,
    };
  }

  const amountMyr = calculateCreditAmount(
    summary.originalPairPriceMyr,
    resolved.discountPercent
  );
  if (amountMyr <= 0) {
    return {
      ok: false,
      code: "INELIGIBLE",
      message: "Computed credit amount is zero",
      httpStatus: 400,
    };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + policyBundle.policy.credit_expiry_days);
  const expiresAtIso = expiresAt.toISOString();

  let creditRow: Tables<"warranty_credits"> | null = null;
  let lastInsertError: string | null = null;

  for (let attempt = 0; attempt < MAX_REDEMPTION_CODE_ATTEMPTS; attempt += 1) {
    const redemptionCode = generateRedemptionCode();
    const creditInsert: TablesInsert<"warranty_credits"> = {
      user_id: params.userId,
      claim_id: null,
      claim_item_id: null,
      registration_id: params.registrationId,
      amount_myr: amountMyr,
      approved_percent: resolved.discountPercent,
      status: "active",
      expires_at: expiresAtIso,
      issued_by: null,
      redemption_code: redemptionCode,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("warranty_credits")
      .insert(creditInsert)
      .select("*")
      .single();

    if (insertError === null && inserted !== null) {
      creditRow = inserted;
      break;
    }

    lastInsertError = insertError?.message ?? "insert failed";
    // Unique violation on redemption_code — retry with a new code.
    if (insertError !== null && insertError.code === "23505") {
      continue;
    }
    console.error("claimWarrantyRegistration: credit insert", lastInsertError);
    return {
      ok: false,
      code: "INTERNAL",
      message: lastInsertError,
      httpStatus: 500,
    };
  }

  if (creditRow === null) {
    return {
      ok: false,
      code: "INTERNAL",
      message: lastInsertError ?? "Failed to issue warranty credit",
      httpStatus: 500,
    };
  }

  const claimedAtIso = new Date().toISOString();
  const { data: updatedRegistration, error: updateError } = await supabase
    .from("warranty_registrations")
    .update({
      status: "claimed",
      claimed_at: claimedAtIso,
      warranty_credit_id: creditRow.id,
      updated_at: claimedAtIso,
    })
    .eq("id", params.registrationId)
    .eq("user_id", params.userId)
    .eq("status", "active")
    .is("warranty_credit_id", null)
    .select("*")
    .maybeSingle();

  if (updateError !== null || updatedRegistration === null) {
    // Another claim won the race — revoke the orphan credit.
    await supabase
      .from("warranty_credits")
      .update({ status: "revoked" })
      .eq("id", creditRow.id)
      .eq("status", "active");

    console.error(
      "claimWarrantyRegistration: registration lock",
      updateError?.message ?? "no rows updated"
    );
    return {
      ok: false,
      code: "ALREADY_CLAIMED",
      message: "This registration has already been claimed",
      httpStatus: 409,
    };
  }

  const voucher = toVoucherPayload(creditRow);
  if (voucher === null) {
    return {
      ok: false,
      code: "INTERNAL",
      message: "Issued credit is missing a redemption code",
      httpStatus: 500,
    };
  }

  const refreshed = await getWarrantyRegistrationForUser(
    supabase,
    params.userId,
    params.registrationId
  );
  if (refreshed.ok === false) {
    return {
      ok: true,
      registration: buildRegistrationSummary(updatedRegistration, {
        productName: summary.productName,
        productImageUrl: summary.productImageUrl,
        storeName: summary.purchaseStoreName,
        maxWarrantyDays: policyBundle.policy.max_warranty_days,
        tiers: policyBundle.tiers,
      }),
      credit: voucher,
    };
  }

  return {
    ok: true,
    registration: refreshed.registration,
    credit: voucher,
  };
}

/**
 * Returns voucher payload for an owned warranty credit (QR display).
 */
export async function getWarrantyVoucherForUser(
  supabase: ServiceClient,
  userId: string,
  creditId: string
): Promise<{ ok: true; voucher: WarrantyVoucherPayload } | WarrantyRegistrationApiError> {
  const { data: credit, error } = await supabase
    .from("warranty_credits")
    .select("*")
    .eq("id", creditId)
    .maybeSingle();

  if (error !== null) {
    console.error("getWarrantyVoucherForUser", error.message);
    return {
      ok: false,
      code: "INTERNAL",
      message: "Failed to load voucher",
      httpStatus: 500,
    };
  }

  if (credit === null) {
    return {
      ok: false,
      code: "CREDIT_NOT_FOUND",
      message: "Warranty credit not found",
      httpStatus: 404,
    };
  }

  if (credit.user_id !== userId) {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Credit does not belong to this account",
      httpStatus: 403,
    };
  }

  const voucher = toVoucherPayload(credit);
  if (voucher === null) {
    return {
      ok: false,
      code: "CREDIT_NOT_FOUND",
      message: "This credit has no redemption code (not a registration voucher)",
      httpStatus: 404,
    };
  }

  return { ok: true, voucher };
}

/**
 * Staff preview: validate a redemption code / credit id without burning it.
 */
export async function previewWarrantyRedeem(
  supabase: ServiceClient,
  params: { redemptionCode?: string; creditId?: string }
): Promise<{ ok: true; preview: RedeemPreviewPayload } | WarrantyRegistrationApiError> {
  const creditResult = await findCreditForRedeem(supabase, params);
  if (creditResult.ok === false) {
    return creditResult;
  }

  const credit = creditResult.credit;
  const eligibility = evaluateCreditRedeemability(credit);

  let customerName: string | null = null;
  let productName: string | null = null;
  let registrationId: string | null = credit.registration_id;

  if (credit.registration_id !== null) {
    const { data: registration } = await supabase
      .from("warranty_registrations")
      .select(
        `
        id,
        customer_name,
        products ( name )
      `
      )
      .eq("id", credit.registration_id)
      .maybeSingle();

    if (registration !== null) {
      customerName = registration.customer_name;
      productName = extractJoinedName(registration.products);
      registrationId = registration.id;
    }
  }

  return {
    ok: true,
    preview: {
      creditId: credit.id,
      redemptionCode: credit.redemption_code,
      amountMyr: Number(credit.amount_myr),
      approvedPercent: Number(credit.approved_percent),
      status: credit.status,
      expiresAt: credit.expires_at,
      redeemable: eligibility.redeemable,
      reasonCode: eligibility.reasonCode,
      reasonMessage: eligibility.reasonMessage,
      customerName,
      productName,
      registrationId,
      redemptionChannel: credit.redemption_channel,
    },
  };
}

/**
 * Staff confirm: mark credit used in-store (single-use).
 */
export async function confirmWarrantyRedeemInStore(
  supabase: ServiceClient,
  params: {
    staffUserId: string;
    redemptionCode: string;
    redeemedStoreId: string;
  }
): Promise<{ ok: true; voucher: WarrantyVoucherPayload } | WarrantyRegistrationApiError> {
  const normalizedCode = normalizeActivationCode(params.redemptionCode);
  if (normalizedCode.length === 0) {
    return {
      ok: false,
      code: "CREDIT_NOT_FOUND",
      message: "Redemption code is invalid",
      httpStatus: 400,
    };
  }

  const { data: store, error: storeError } = await supabase
    .from("store_locations")
    .select("id, active")
    .eq("id", params.redeemedStoreId)
    .maybeSingle();

  if (storeError !== null) {
    console.error("confirmWarrantyRedeemInStore: store", storeError.message);
    return {
      ok: false,
      code: "INTERNAL",
      message: "Could not validate redeem store",
      httpStatus: 500,
    };
  }

  if (store === null || store.active !== true) {
    return {
      ok: false,
      code: "STORE_INVALID",
      message: "Redeem store is invalid or inactive",
      httpStatus: 400,
    };
  }

  const creditResult = await findCreditForRedeem(supabase, {
    redemptionCode: normalizedCode,
  });
  if (creditResult.ok === false) {
    return creditResult;
  }

  const credit = creditResult.credit;
  const eligibility = evaluateCreditRedeemability(credit);
  if (eligibility.redeemable !== true) {
    return {
      ok: false,
      code: eligibility.reasonCode ?? "INELIGIBLE",
      message: eligibility.reasonMessage ?? "Credit is not redeemable",
      httpStatus: eligibility.reasonCode === "CREDIT_USED" ? 409 : 400,
    };
  }

  const nowIso = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("warranty_credits")
    .update({
      status: "used",
      used_at: nowIso,
      redemption_channel: "in_store",
      redeemed_store_id: params.redeemedStoreId,
      redeemed_by_staff_id: params.staffUserId,
    })
    .eq("id", credit.id)
    .eq("status", "active")
    .select("*")
    .maybeSingle();

  if (updateError !== null || updated === null) {
    console.error(
      "confirmWarrantyRedeemInStore: update",
      updateError?.message ?? "no rows updated"
    );
    return {
      ok: false,
      code: "CREDIT_USED",
      message: "Credit was already redeemed",
      httpStatus: 409,
    };
  }

  const voucher = toVoucherPayload(updated);
  if (voucher === null) {
    return {
      ok: false,
      code: "INTERNAL",
      message: "Redeemed credit is missing a redemption code",
      httpStatus: 500,
    };
  }

  return { ok: true, voucher };
}

/**
 * Maps an API error to a JSON NextResponse-friendly body.
 */
export function warrantyErrorBody(error: WarrantyRegistrationApiError): {
  error: WarrantyRegistrationErrorCode;
  message: string;
} {
  return { error: error.code, message: error.message };
}

function toVoucherPayload(credit: Tables<"warranty_credits">): WarrantyVoucherPayload | null {
  if (typeof credit.redemption_code !== "string" || credit.redemption_code.length === 0) {
    return null;
  }

  return {
    creditId: credit.id,
    redemptionCode: credit.redemption_code,
    amountMyr: Number(credit.amount_myr),
    approvedPercent: Number(credit.approved_percent),
    expiresAt: credit.expires_at,
    status: credit.status,
    redemptionChannel: credit.redemption_channel,
    registrationId: credit.registration_id,
    usedAt: credit.used_at,
  };
}

function evaluateCreditRedeemability(credit: Tables<"warranty_credits">): {
  redeemable: boolean;
  reasonCode: WarrantyRegistrationErrorCode | null;
  reasonMessage: string | null;
} {
  if (credit.status === "used") {
    return {
      redeemable: false,
      reasonCode: "CREDIT_USED",
      reasonMessage: "Credit has already been redeemed",
    };
  }

  if (credit.status === "expired" || credit.status === "revoked") {
    return {
      redeemable: false,
      reasonCode: "CREDIT_EXPIRED",
      reasonMessage: "Credit is no longer available",
    };
  }

  if (credit.status !== "active") {
    return {
      redeemable: false,
      reasonCode: "INELIGIBLE",
      reasonMessage: "Credit is not redeemable",
    };
  }

  const expiresAt = new Date(credit.expires_at);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    return {
      redeemable: false,
      reasonCode: "CREDIT_EXPIRED",
      reasonMessage: "Credit has expired",
    };
  }

  return {
    redeemable: true,
    reasonCode: null,
    reasonMessage: null,
  };
}

async function findCreditForRedeem(
  supabase: ServiceClient,
  params: { redemptionCode?: string; creditId?: string }
): Promise<{ ok: true; credit: Tables<"warranty_credits"> } | WarrantyRegistrationApiError> {
  if (typeof params.creditId === "string" && params.creditId.length > 0) {
    const { data, error } = await supabase
      .from("warranty_credits")
      .select("*")
      .eq("id", params.creditId)
      .maybeSingle();

    if (error !== null) {
      console.error("findCreditForRedeem: by id", error.message);
      return {
        ok: false,
        code: "INTERNAL",
        message: "Could not load credit",
        httpStatus: 500,
      };
    }

    if (data === null) {
      return {
        ok: false,
        code: "CREDIT_NOT_FOUND",
        message: "Warranty credit not found",
        httpStatus: 404,
      };
    }

    return { ok: true, credit: data };
  }

  if (typeof params.redemptionCode === "string" && params.redemptionCode.length > 0) {
    const normalized = normalizeActivationCode(params.redemptionCode);
    const { data, error } = await supabase
      .from("warranty_credits")
      .select("*")
      .eq("redemption_code", normalized)
      .maybeSingle();

    if (error !== null) {
      console.error("findCreditForRedeem: by code", error.message);
      return {
        ok: false,
        code: "INTERNAL",
        message: "Could not load credit",
        httpStatus: 500,
      };
    }

    if (data === null) {
      return {
        ok: false,
        code: "CREDIT_NOT_FOUND",
        message: "Redemption code not found",
        httpStatus: 404,
      };
    }

    return { ok: true, credit: data };
  }

  return {
    ok: false,
    code: "CREDIT_NOT_FOUND",
    message: "redemptionCode or creditId is required",
    httpStatus: 400,
  };
}

/**
 * Narrows DB status text to the known registration status union.
 */
function parseRegistrationStatus(value: string): WarrantyRegistrationStatus {
  if (
    value === "active" ||
    value === "claimed" ||
    value === "expired" ||
    value === "void"
  ) {
    return value;
  }
  return "void";
}

/** Number of warranty month tabs covering a full maxWarrantyDays year. */
const WARRANTY_MONTH_TAB_COUNT = 12;
const POLICY_DAY_MS = 24 * 60 * 60 * 1000;
/** Fallback bucket length when purchase date cannot be parsed. */
const FIXED_WARRANTY_MONTH_DAYS = 30;

type PurchaseYmd = {
  year: number;
  month: number;
  day: number;
};

/**
 * Parses a `YYYY-MM-DD` purchase date into UTC calendar parts.
 */
function parsePurchaseYmd(purchaseDate: string): PurchaseYmd | null {
  const datePart = purchaseDate.trim().slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (match === null) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  const utc = Date.UTC(year, month - 1, day);
  const check = new Date(utc);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

/**
 * Days in a UTC calendar month (1–12).
 */
function daysInUtcMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Adds calendar months in UTC, clamping day-of-month for short months (e.g. Jan 31 → Feb 28/29).
 */
function addUtcCalendarMonths(ymd: PurchaseYmd, monthsToAdd: number): PurchaseYmd {
  const base = new Date(Date.UTC(ymd.year, ymd.month - 1 + monthsToAdd, 1));
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth() + 1;
  const day = Math.min(ymd.day, daysInUtcMonth(year, month));
  return { year, month, day };
}

/**
 * Whole UTC calendar days from `from` to `to` (same-day → 0).
 */
function utcDaysBetween(from: PurchaseYmd, to: PurchaseYmd): number {
  const fromMs = Date.UTC(from.year, from.month - 1, from.day);
  const toMs = Date.UTC(to.year, to.month - 1, to.day);
  return Math.floor((toMs - fromMs) / POLICY_DAY_MS);
}

/**
 * Resolves the discount percent that applies at the start of a warranty month window.
 */
function discountPercentForDay(
  dayIndex: number,
  tiers: readonly {
    days_from: number;
    days_to: number;
    discount_percent: number;
    sort_order: number;
  }[],
  maxWarrantyDays: number
): number {
  const resolved = resolveWarrantyTier(dayIndex, tiers, maxWarrantyDays);
  return resolved.tierFound ? resolved.discountPercent : 0;
}

/**
 * Builds Month 1–12 tab rows from real calendar months since purchase.
 * Month 12 is extended through `maxWarrantyDays` (365) so the full warranty year is covered.
 * Falls back to fixed 30-day buckets when the purchase date is unparseable.
 */
function buildPolicyTiers(
  originalPairPriceMyr: number,
  tiers: readonly {
    days_from: number;
    days_to: number;
    discount_percent: number;
    sort_order: number;
  }[],
  maxWarrantyDays: number,
  purchaseDate: string
): RegistrationPolicyTier[] {
  const purchase = parsePurchaseYmd(purchaseDate);
  if (purchase === null) {
    return buildFixedThirtyDayPolicyTiers(
      originalPairPriceMyr,
      tiers,
      maxWarrantyDays
    );
  }

  const result: RegistrationPolicyTier[] = [];
  for (let monthIndex = 1; monthIndex <= WARRANTY_MONTH_TAB_COUNT; monthIndex += 1) {
    const start = addUtcCalendarMonths(purchase, monthIndex - 1);
    const nextStart = addUtcCalendarMonths(purchase, monthIndex);
    let daysFrom = utcDaysBetween(purchase, start);
    let daysTo = utcDaysBetween(purchase, nextStart) - 1;

    if (daysFrom > maxWarrantyDays) {
      break;
    }

    if (daysTo < daysFrom) {
      daysTo = daysFrom;
    }
    daysTo = Math.min(daysTo, maxWarrantyDays);
    if (monthIndex === WARRANTY_MONTH_TAB_COUNT) {
      daysTo = maxWarrantyDays;
    }

    const discountPercent = discountPercentForDay(daysFrom, tiers, maxWarrantyDays);
    result.push({
      monthIndex,
      daysFrom,
      daysTo,
      discountPercent,
      estimatedCreditMyr: calculateCreditAmount(originalPairPriceMyr, discountPercent),
    });

    if (daysTo >= maxWarrantyDays) {
      break;
    }
  }

  const last = result[result.length - 1];
  if (last !== undefined && last.daysTo < maxWarrantyDays) {
    last.daysTo = maxWarrantyDays;
  }

  return result;
}

/**
 * Fixed 30-day warranty month buckets (Month 12 gets the remainder through maxWarrantyDays).
 */
function buildFixedThirtyDayPolicyTiers(
  originalPairPriceMyr: number,
  tiers: readonly {
    days_from: number;
    days_to: number;
    discount_percent: number;
    sort_order: number;
  }[],
  maxWarrantyDays: number
): RegistrationPolicyTier[] {
  const result: RegistrationPolicyTier[] = [];
  for (let monthIndex = 1; monthIndex <= WARRANTY_MONTH_TAB_COUNT; monthIndex += 1) {
    const daysFrom = (monthIndex - 1) * FIXED_WARRANTY_MONTH_DAYS;
    if (daysFrom > maxWarrantyDays) {
      break;
    }
    const daysTo = Math.min(
      monthIndex * FIXED_WARRANTY_MONTH_DAYS - 1,
      maxWarrantyDays
    );
    const discountPercent = discountPercentForDay(daysFrom, tiers, maxWarrantyDays);
    result.push({
      monthIndex,
      daysFrom,
      daysTo: monthIndex === WARRANTY_MONTH_TAB_COUNT ? maxWarrantyDays : daysTo,
      discountPercent,
      estimatedCreditMyr: calculateCreditAmount(originalPairPriceMyr, discountPercent),
    });
    if (daysTo >= maxWarrantyDays) {
      break;
    }
  }
  const last = result[result.length - 1];
  if (last !== undefined && last.daysTo < maxWarrantyDays) {
    last.daysTo = maxWarrantyDays;
  }
  return result;
}

/**
 * Reads a numeric `arrangement` field from an embedded product media row.
 */
function readMediaArrangement(value: object): number {
  const arrangementValue: unknown = Reflect.get(value, "arrangement");
  if (typeof arrangementValue === "number" && Number.isFinite(arrangementValue)) {
    return arrangementValue;
  }
  return 999;
}

/**
 * Picks the lowest-arrangement `media_url` from a joined `products` relation.
 */
function extractPrimaryProductImageUrl(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return null;
    }
    return extractPrimaryProductImageUrl(value[0]);
  }

  if (typeof value !== "object") {
    return null;
  }

  const mediasValue: unknown = Reflect.get(value, "product_medias");
  if (!Array.isArray(mediasValue) || mediasValue.length === 0) {
    return null;
  }

  const sorted = [...mediasValue].sort((left, right) => {
    const leftArrangement =
      typeof left === "object" && left !== null ? readMediaArrangement(left) : 999;
    const rightArrangement =
      typeof right === "object" && right !== null ? readMediaArrangement(right) : 999;
    return leftArrangement - rightArrangement;
  });

  const primary = sorted[0];
  if (typeof primary !== "object" || primary === null) {
    return null;
  }

  const mediaUrlValue: unknown = Reflect.get(primary, "media_url");
  if (typeof mediaUrlValue !== "string") {
    return null;
  }
  const trimmed = mediaUrlValue.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Extracts `name` from a Supabase embedded relation that may be object, array, or null.
 */
function extractJoinedName(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return null;
    }
    return extractJoinedName(value[0]);
  }

  if (typeof value !== "object") {
    return null;
  }

  const nameValue: unknown = Reflect.get(value, "name");
  return typeof nameValue === "string" ? nameValue : null;
}
