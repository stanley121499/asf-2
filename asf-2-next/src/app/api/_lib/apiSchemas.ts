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

export type CreatePaymentIntentBody = z.infer<typeof createPaymentIntentBodySchema>;
export type CreatePendingOrderBody = z.infer<typeof createPendingOrderBodySchema>;
export type DeliveryRatesBody = z.infer<typeof deliveryRatesBodySchema>;
export type DeliveryCreateShipmentBody = z.infer<typeof deliveryCreateShipmentBodySchema>;
export type PromotionValidateBody = z.infer<typeof promotionValidateBodySchema>;
export type PromotionCreateBody = z.infer<typeof promotionCreateBodySchema>;
export type PromotionPatchBody = z.infer<typeof promotionPatchBodySchema>;
export type StoreLocationCreateBody = z.infer<typeof storeLocationCreateBodySchema>;
export type StoreLocationPatchBody = z.infer<typeof storeLocationPatchBodySchema>;
