/**
 * Zod request-body schemas for App Router API handlers.
 *
 * **Exception:** `POST /api/stripe/webhook` uses the raw request body for Stripe
 * `constructEvent` signature verification — do not parse JSON or apply these schemas there.
 */

import { z } from "zod";

import { isUuid } from "@/utils/uuid";

/** UUID strings accepted by the same rule as legacy `isUuid()` (canonical form). */
export const uuidStringSchema = z.string().refine((value) => isUuid(value), {
  message: "Must be a valid UUID",
});

const discountTypeSchema = z.enum(["percentage", "fixed"]);

const weightKgSchema = z.object({
  unit: z.literal("kg"),
  value: z.number().finite().positive(),
});

const dimensionsCmSchema = z.object({
  unit: z.literal("cm"),
  width: z.number().finite().positive(),
  length: z.number().finite().positive(),
  height: z.number().finite().positive(),
});

const destinationSchema = z.object({
  address1: z.string(),
  city: z.string(),
  state: z.string(),
  postcode: z.string(),
  country: z.string(),
});

/**
 * Structured shipping address (matches checkout + Delyva expectations).
 */
export const shippingStructuredSchema = z.object({
  address1: z.string().trim().min(1, "address1 is required"),
  address2: z.string(),
  city: z.string().trim().min(1, "city is required"),
  state: z.string().trim().min(1, "state is required"),
  postcode: z.string().trim().min(1, "postcode is required"),
  country: z.string().trim().min(1, "country is required"),
  recipientName: z.string().trim().min(1, "recipientName is required"),
  recipientPhone: z.string().trim().min(1, "recipientPhone is required"),
});

const discountValueSchema = z.union([
  z.number().finite().nonnegative(),
  z
    .string()
    .trim()
    .transform((s) => Number.parseFloat(s))
    .refine((n) => Number.isFinite(n) && n >= 0, "discount_value must be a non-negative number"),
]);

/**
 * Create payload: omitted or null → DB null; non-empty string allowed; empty string is invalid.
 */
const promotionCreateDateField = (fieldLabel: string) =>
  z
    .union([z.null(), z.string()])
    .optional()
    .superRefine((val, ctx) => {
      if (val !== undefined && val !== null && val.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${fieldLabel} must be null, omitted, or a non-empty string`,
        });
      }
    })
    .transform((val): string | null => {
      if (val === undefined || val === null) {
        return null;
      }
      return val;
    });

export const createPaymentIntentBodySchema = z.object({
  userId: uuidStringSchema,
  orderId: uuidStringSchema.optional(),
});

export const createPendingOrderBodySchema = z
  .object({
    userId: uuidStringSchema,
    shipping_address: z.string().trim().min(1, "shipping_address must be non-empty"),
    shipping_address_structured: shippingStructuredSchema,
    promoCode: z.string().optional(),
    promotionId: uuidStringSchema.optional(),
    warrantyCreditId: uuidStringSchema.optional(),
    /** Delyva service code chosen at checkout (validated server-side via re-quote). */
    serviceCode: z.string().min(1).optional(),
  })
  .strict();

export const deliveryRatesBodySchema = z
  .object({
    destination: destinationSchema,
    /** Explicit weight for admin/manual callers; omitted when userId is sent (computed from cart). */
    weight: weightKgSchema.optional(),
    /** When set, parcel weight is computed from this user's cart server-side. */
    userId: uuidStringSchema.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasUserId = data.userId !== undefined;
    const hasWeight = data.weight !== undefined;
    if (!hasUserId && !hasWeight) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either userId or weight is required",
      });
    }
  });

export const deliveryCreateShipmentBodySchema = z
  .object({
    orderId: uuidStringSchema,
    serviceCode: z.string().min(1, "serviceCode is required"),
    weight: weightKgSchema,
    dimensions: dimensionsCmSchema.optional(),
  })
  .strict();

export const promotionValidateBodySchema = z
  .object({
    code: z.string(),
    cartLines: z.array(
      z
        .object({
          product_id: z.string().min(1, "product_id is required"),
          amount: z.number().finite().positive(),
        })
        .strict(),
    ),
  })
  .strict();

export const promotionCreateBodySchema = z
  .object({
    name: z.string().trim().min(1, "name is required"),
    description: z.union([z.string(), z.null()]).optional(),
    code: z.union([z.string(), z.null()]).optional(),
    discount_type: discountTypeSchema,
    discount_value: discountValueSchema,
    start_date: promotionCreateDateField("start_date"),
    end_date: promotionCreateDateField("end_date"),
    active: z.boolean().optional().default(true),
    max_uses: z
      .union([
        z.null(),
        z.number().int().positive(),
      ])
      .optional(),
    product_ids: z.array(uuidStringSchema).optional(),
  })
  .strict();

const patchDateToNull = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v): string | null | undefined => {
    if (v === undefined) {
      return undefined;
    }
    if (v === null) {
      return null;
    }
    return v.length === 0 ? null : v;
  });

export const promotionPatchBodySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.union([z.string(), z.null()]).optional(),
    code: z.union([z.string(), z.null()]).optional(),
    discount_type: discountTypeSchema.optional(),
    discount_value: discountValueSchema.optional(),
    start_date: patchDateToNull,
    end_date: patchDateToNull,
    active: z.boolean().optional(),
    max_uses: z
      .union([
        z.null(),
        z.number().int().positive(),
      ])
      .optional(),
    product_ids: z.array(uuidStringSchema).optional(),
  })
  .strict();

export const orderIdParamSchema = z.object({
  orderId: uuidStringSchema,
});

export const promotionIdParamSchema = z.object({
  id: uuidStringSchema,
});

/** Optional URL: empty string becomes null; must be valid URL when non-empty. */
const optionalUrlField = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value): string | null | undefined => {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }
    return trimmed;
  })
  .refine(
    (value) => value === undefined || value === null || z.string().url().safeParse(value).success,
    { message: "Must be a valid URL" }
  );

const optionalNumericField = z
  .union([z.number(), z.null()])
  .optional();

/** Optional list of image URLs: trims, drops empties, validates each entry. */
const imageUrlsField = z
  .array(z.string())
  .optional()
  .transform((value): string[] | undefined => {
    if (value === undefined) {
      return undefined;
    }
    return value.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  })
  .refine(
    (value) =>
      value === undefined ||
      value.every((entry) => z.string().url().safeParse(entry).success),
    { message: "Each image must be a valid URL" }
  );

export const storeLocationCreateBodySchema = z
  .object({
    name: z.string().trim().min(1, "name is required"),
    mall_name: z.string().trim().min(1, "mall_name is required"),
    address_line_1: z.string().trim().min(1, "address_line_1 is required"),
    address_line_2: z.union([z.string(), z.null()]).optional(),
    city: z.string().trim().min(1, "city is required"),
    state: z.string().trim().min(1, "state is required"),
    postcode: z.union([z.string(), z.null()]).optional(),
    country: z.string().trim().min(1).optional().default("Malaysia"),
    phone: z.union([z.string(), z.null()]).optional(),
    opening_hours: z.union([z.string(), z.null()]).optional(),
    latitude: optionalNumericField,
    longitude: optionalNumericField,
    google_maps_url: optionalUrlField,
    waze_url: optionalUrlField,
    image_urls: imageUrlsField,
    sort_order: z.number().int().optional().default(0),
    active: z.boolean().optional().default(true),
  })
  .strict();

export const storeLocationPatchBodySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    mall_name: z.string().trim().min(1).optional(),
    address_line_1: z.string().trim().min(1).optional(),
    address_line_2: z.union([z.string(), z.null()]).optional(),
    city: z.string().trim().min(1).optional(),
    state: z.string().trim().min(1).optional(),
    postcode: z.union([z.string(), z.null()]).optional(),
    country: z.string().trim().min(1).optional(),
    phone: z.union([z.string(), z.null()]).optional(),
    opening_hours: z.union([z.string(), z.null()]).optional(),
    latitude: optionalNumericField,
    longitude: optionalNumericField,
    google_maps_url: optionalUrlField,
    waze_url: optionalUrlField,
    image_urls: imageUrlsField,
    sort_order: z.number().int().optional(),
    active: z.boolean().optional(),
  })
  .strict();

export const storeLocationIdParamSchema = z.object({
  id: uuidStringSchema,
});

export const warrantyEligibilityBodySchema = z
  .object({
    orderId: uuidStringSchema,
    orderItemIds: z.array(uuidStringSchema).min(1, "At least one order item is required"),
    claimTypeKey: z.string().trim().min(1, "claimTypeKey is required"),
  })
  .strict();

export const warrantyCreditApplyBodySchema = z
  .object({
    creditId: uuidStringSchema,
    cartSubtotalMyr: z.number().finite().nonnegative(),
  })
  .strict();

export const warrantyClaimApproveBodySchema = z
  .object({
    claimId: uuidStringSchema,
    items: z
      .array(
        z
          .object({
            claimItemId: uuidStringSchema,
            approvedPercent: z.number().finite().min(0).max(100),
          })
          .strict()
      )
      .min(1, "At least one claim item is required"),
    staffNotes: z.union([z.string(), z.null()]).optional(),
  })
  .strict();

/** ISO calendar date YYYY-MM-DD (purchase date for physical registration). */
const isoDateStringSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");

/**
 * POST /api/warranty/registrations/activate — customer activates a physical card code.
 */
export const warrantyRegistrationActivateBodySchema = z
  .object({
    code: z.string().trim().min(1, "Activation code is required"),
    purchaseDate: isoDateStringSchema,
    purchaseStoreId: uuidStringSchema,
    customerName: z.string().trim().min(1, "customerName is required"),
    customerEmail: z.string().trim().email("customerEmail must be a valid email"),
    customerPhone: z.string().trim().min(1, "customerPhone is required"),
    staffName: z.union([z.string().trim().min(1), z.null()]).optional(),
    receiptUrl: z.union([z.string().trim().url(), z.null()]).optional(),
  })
  .strict();

/**
 * POST /api/warranty/redeem/preview — staff validates a voucher before burning.
 * At least one of redemptionCode or creditId is required.
 */
export const warrantyRedeemPreviewBodySchema = z
  .object({
    redemptionCode: z.string().trim().min(1).optional(),
    creditId: uuidStringSchema.optional(),
  })
  .strict()
  .refine(
    (body) =>
      (typeof body.redemptionCode === "string" && body.redemptionCode.length > 0) ||
      typeof body.creditId === "string",
    { message: "redemptionCode or creditId is required" }
  );

/**
 * POST /api/warranty/redeem/confirm — staff burns voucher in-store.
 */
export const warrantyRedeemConfirmBodySchema = z
  .object({
    redemptionCode: z.string().trim().min(1, "redemptionCode is required"),
    redeemedStoreId: uuidStringSchema,
  })
  .strict();

const warrantyTierInputSchema = z
  .object({
    id: uuidStringSchema.optional(),
    days_from: z.number().int().nonnegative(),
    days_to: z.number().int().nonnegative(),
    discount_percent: z.number().finite().min(0).max(100),
    sort_order: z.number().int().nonnegative(),
  })
  .strict()
  .refine((t) => t.days_from <= t.days_to, {
    message: "days_from must be <= days_to",
  });

export const warrantyPolicyPatchBodySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    max_warranty_days: z.number().int().positive().optional(),
    credit_expiry_days: z.number().int().positive().optional(),
    module_label: z.union([z.string(), z.null()]).optional(),
    active: z.boolean().optional(),
    tiers: z.array(warrantyTierInputSchema).optional(),
  })
  .strict();

const claimStatusSchema = z.enum([
  "submitted",
  "in_review",
  "needs_info",
  "approved",
  "rejected",
  "resolved",
]);

/**
 * Staff claim status transition body for `POST /api/claims/[claimId]/status`.
 */
export const claimStatusChangeBodySchema = z
  .object({
    newStatus: claimStatusSchema,
    notes: z.union([z.string(), z.null()]).optional(),
    notifyExtraBody: z.string().optional(),
    staff_notes: z.union([z.string(), z.null()]).optional(),
    approved_resolution: z.string().optional(),
    rejection_reason: z.string().optional(),
  })
  .strict();

const orderStatusSchema = z.enum([
  "pending",
  "processing",
  "shipped",
  "completed",
  "cancelled",
]);

/**
 * Staff order status transition body for `POST /api/orders/[orderId]/status`.
 */
export const orderStatusChangeBodySchema = z
  .object({
    newStatus: orderStatusSchema,
  })
  .strict();

const notificationTemplateLocaleFieldsSchema = z
  .object({
    title_template: z.string().min(1, "title_template is required"),
    body_template: z.string().min(1, "body_template is required"),
  })
  .strict();

/**
 * Staff PUT body for upserting one transactional type × three locales.
 */
export const notificationTemplatesUpsertBodySchema = z
  .object({
    type: z.string().trim().min(1, "type is required"),
    locales: z
      .object({
        en: notificationTemplateLocaleFieldsSchema,
        "zh-CN": notificationTemplateLocaleFieldsSchema,
        ms: notificationTemplateLocaleFieldsSchema,
      })
      .strict(),
  })
  .strict();

/** Locales staff compose for promotional campaigns. */
const notificationCampaignLocaleSchema = z.enum(["zh-CN", "en", "ms"]);

/** Flat i18n map for campaign title or body (all three locales required as keys). */
const notificationCampaignI18nSchema = z
  .object({
    en: z.string(),
    "zh-CN": z.string(),
    ms: z.string(),
  })
  .strict();

/**
 * Staff POST body for creating a promotional campaign draft.
 *
 * Requires non-empty title and body for `default_locale`. Other locales may be
 * blank and fall back at send time (plan §8).
 *
 * `deep_link` convention (stored in notification metadata): Expo path such as
 * `/(tabs)/browse`, or `product:<uuid>` / `order:<uuid>` style targets.
 */
export const notificationCampaignCreateBodySchema = z
  .object({
    title_i18n: notificationCampaignI18nSchema,
    body_i18n: notificationCampaignI18nSchema,
    default_locale: notificationCampaignLocaleSchema,
    deep_link: z
      .union([z.string(), z.null()])
      .optional()
      .transform((value): string | null => {
        if (value === undefined || value === null) {
          return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      }),
  })
  .strict()
  .superRefine((data, ctx) => {
    const locale = data.default_locale;
    const title = data.title_i18n[locale].trim();
    const body = data.body_i18n[locale].trim();
    if (title.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `title_i18n.${locale} is required for default_locale`,
        path: ["title_i18n", locale],
      });
    }
    if (body.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `body_i18n.${locale} is required for default_locale`,
        path: ["body_i18n", locale],
      });
    }
  });

/** Path param for campaign send route. */
export const notificationCampaignIdParamSchema = z.object({
  id: uuidStringSchema,
});

/** Query param for listing store product stock by product. */
export const storeProductStockQuerySchema = z.object({
  productId: uuidStringSchema,
});

/**
 * One store × SKU count row for upsert.
 * `colorId` / `sizeId` may be null to match `product_stock` nullability.
 */
export const storeProductStockRowSchema = z
  .object({
    storeLocationId: uuidStringSchema,
    colorId: z.union([uuidStringSchema, z.null()]),
    sizeId: z.union([uuidStringSchema, z.null()]),
    count: z.number().int().min(0, "count must be >= 0"),
  })
  .strict();

/** PUT body: batch upsert store stock for one product. */
export const storeProductStockUpsertBodySchema = z
  .object({
    productId: uuidStringSchema,
    rows: z.array(storeProductStockRowSchema).max(2000),
  })
  .strict();

export type CreatePaymentIntentBody = z.infer<typeof createPaymentIntentBodySchema>;
export type CreatePendingOrderBody = z.infer<typeof createPendingOrderBodySchema>;
export type DeliveryRatesBody = z.infer<typeof deliveryRatesBodySchema>;
export type DeliveryCreateShipmentBody = z.infer<typeof deliveryCreateShipmentBodySchema>;
export type PromotionValidateBody = z.infer<typeof promotionValidateBodySchema>;
export type PromotionCreateBody = z.infer<typeof promotionCreateBodySchema>;
export type PromotionPatchBody = z.infer<typeof promotionPatchBodySchema>;
export type StoreLocationCreateBody = z.infer<typeof storeLocationCreateBodySchema>;
export type StoreLocationPatchBody = z.infer<typeof storeLocationPatchBodySchema>;
export type WarrantyRegistrationActivateBody = z.infer<
  typeof warrantyRegistrationActivateBodySchema
>;
export type WarrantyRedeemPreviewBody = z.infer<typeof warrantyRedeemPreviewBodySchema>;
export type WarrantyRedeemConfirmBody = z.infer<typeof warrantyRedeemConfirmBodySchema>;
export type ClaimStatusChangeBody = z.infer<typeof claimStatusChangeBodySchema>;
export type OrderStatusChangeBody = z.infer<typeof orderStatusChangeBodySchema>;
export type NotificationTemplatesUpsertBody = z.infer<
  typeof notificationTemplatesUpsertBodySchema
>;
export type NotificationCampaignCreateBody = z.infer<
  typeof notificationCampaignCreateBodySchema
>;
export type StoreProductStockUpsertBody = z.infer<
  typeof storeProductStockUpsertBodySchema
>;
export type StoreProductStockRowInput = z.infer<typeof storeProductStockRowSchema>;

/**
 * POST /api/location/snapshot — customer upsert of latest WGS-84 coordinates.
 * Rejects out-of-range / non-finite coords (plan §12).
 */
export const locationSnapshotBodySchema = z
  .object({
    latitude: z.number().finite().gte(-90).lte(90),
    longitude: z.number().finite().gte(-180).lte(180),
    accuracyM: z.number().finite().nonnegative().optional(),
  })
  .strict();

/** Content types eligible for first-view discovery point awards. */
export const contentViewTypeSchema = z.enum(["product", "post", "promo"]);

/**
 * PATCH /api/rewards/settings — staff update for singleton rewards_settings.
 */
export const rewardsSettingsPatchBodySchema = z
  .object({
    content_view_points: z.number().int().nonnegative(),
  })
  .strict();

/**
 * POST /api/rewards/content-view — customer first-view award request.
 * Points amount is never accepted from the client (server reads rewards_settings).
 */
export const contentViewAwardBodySchema = z
  .object({
    contentType: contentViewTypeSchema,
    contentId: uuidStringSchema,
  })
  .strict();

export type LocationSnapshotBody = z.infer<typeof locationSnapshotBodySchema>;
export type RewardsSettingsPatchBody = z.infer<typeof rewardsSettingsPatchBodySchema>;
export type ContentViewAwardBody = z.infer<typeof contentViewAwardBodySchema>;
export type ContentViewType = z.infer<typeof contentViewTypeSchema>;
