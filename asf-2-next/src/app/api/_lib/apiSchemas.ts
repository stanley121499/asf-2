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
  })
  .strict();

export const deliveryRatesBodySchema = z
  .object({
    destination: destinationSchema,
    weight: weightKgSchema,
  })
  .strict();

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

export type CreatePaymentIntentBody = z.infer<typeof createPaymentIntentBodySchema>;
export type CreatePendingOrderBody = z.infer<typeof createPendingOrderBodySchema>;
export type DeliveryRatesBody = z.infer<typeof deliveryRatesBodySchema>;
export type DeliveryCreateShipmentBody = z.infer<typeof deliveryCreateShipmentBodySchema>;
export type PromotionValidateBody = z.infer<typeof promotionValidateBodySchema>;
export type PromotionCreateBody = z.infer<typeof promotionCreateBodySchema>;
export type PromotionPatchBody = z.infer<typeof promotionPatchBodySchema>;
