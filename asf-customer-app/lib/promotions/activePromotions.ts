import type { Promotion } from "@/context/PromotionContext";
import type { Locale } from "@/i18n/types";

/**
 * Returns a trimmed promo code, or null when missing / blank.
 */
export function getPromotionCode(
  promotion: Pick<Promotion, "code">
): string | null {
  if (typeof promotion.code !== "string") {
    return null;
  }
  const trimmed = promotion.code.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Locale-aware promotion title for home / cart surfaces.
 * Catalog `promotions.name` is Chinese-canonical; for `en` / `ms` prefer the
 * locale-agnostic promo code so the Offers strip does not stay stuck in Chinese.
 */
export function resolvePromotionDisplayTitle(
  promotion: Pick<Promotion, "name" | "code">,
  locale: Locale
): string {
  if (locale === "zh-CN") {
    return promotion.name;
  }
  const code = getPromotionCode(promotion);
  if (code !== null) {
    return code;
  }
  return promotion.name;
}

/**
 * Returns true when a promotion is currently active for home display.
 * Invalid date bounds are treated as inactive for that bound.
 */
export function isPromotionActiveNow(
  promotion: Promotion,
  now: Date = new Date()
): boolean {
  if (promotion.active !== true) {
    return false;
  }

  if (promotion.deleted_at !== null && promotion.deleted_at.length > 0) {
    return false;
  }

  const nowMs = now.getTime();

  if (promotion.start_date !== null && promotion.start_date.length > 0) {
    const startMs = Date.parse(promotion.start_date);
    if (Number.isNaN(startMs) || startMs > nowMs) {
      return false;
    }
  }

  if (promotion.end_date !== null && promotion.end_date.length > 0) {
    const endMs = Date.parse(promotion.end_date);
    if (Number.isNaN(endMs) || endMs < nowMs) {
      return false;
    }
  }

  return true;
}

/**
 * Filters promotions to those active at `now`.
 */
export function filterActivePromotions(
  promotions: readonly Promotion[],
  now: Date = new Date()
): Promotion[] {
  return promotions.filter((p) => isPromotionActiveNow(p, now));
}

export type DiscountLabelParams = {
  key: "home.offerPercentOff" | "home.offerFixedOff";
  value: string;
};

/**
 * Builds i18n key + value for a promotion discount line.
 * Percentage uses the raw discount_value; fixed uses a 2-decimal amount string.
 */
export function formatPromotionDiscountLabel(
  promotion: Pick<Promotion, "discount_type" | "discount_value">
): DiscountLabelParams | null {
  const rawValue: unknown = promotion.discount_value;
  const value =
    typeof rawValue === "number"
      ? rawValue
      : typeof rawValue === "string"
        ? Number(rawValue)
        : Number.NaN;

  if (!Number.isFinite(value)) {
    return null;
  }

  if (promotion.discount_type === "percentage") {
    const display =
      Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
    return { key: "home.offerPercentOff", value: display };
  }

  if (promotion.discount_type === "fixed") {
    return { key: "home.offerFixedOff", value: value.toFixed(2) };
  }

  return null;
}
