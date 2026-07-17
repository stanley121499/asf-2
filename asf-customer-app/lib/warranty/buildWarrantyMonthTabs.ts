import { calculateCreditAmount } from "@/lib/warranty/calculateCreditAmount";
import type { RegistrationPolicyTier } from "@/lib/warranty/warrantyRegistrationApi";

/** Warranty month tabs covering a full maxWarrantyDays year. */
export const WARRANTY_MONTH_TAB_COUNT = 12;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Fallback bucket length when purchase date cannot be parsed. */
const FIXED_WARRANTY_MONTH_DAYS = 30;

type PurchaseYmd = {
  year: number;
  month: number;
  day: number;
};

type DiscountSource = {
  daysFrom: number;
  daysTo: number;
  discountPercent: number;
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
 * Adds calendar months in UTC, clamping day-of-month for short months.
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
  return Math.floor((toMs - fromMs) / DAY_MS);
}

/**
 * Picks the discount percent that covers `dayIndex` from API/policy sources.
 */
function discountPercentForDay(
  dayIndex: number,
  sources: readonly DiscountSource[]
): number {
  const hit = sources.find(
    (row) => dayIndex >= row.daysFrom && dayIndex <= row.daysTo
  );
  if (hit !== undefined) {
    return hit.discountPercent;
  }
  return 0;
}

/**
 * Builds one month-tab row with credit estimate for the pair price.
 */
function toMonthTab(
  monthIndex: number,
  daysFrom: number,
  daysTo: number,
  discountPercent: number,
  originalPairPriceMyr: number
): RegistrationPolicyTier {
  return {
    monthIndex,
    daysFrom,
    daysTo,
    discountPercent,
    estimatedCreditMyr: calculateCreditAmount(originalPairPriceMyr, discountPercent),
  };
}

/**
 * Fixed 30-day warranty month buckets (Month 12 gets remainder through maxWarrantyDays).
 */
function buildFixedThirtyDayMonthTabs(
  maxWarrantyDays: number,
  discountSources: readonly DiscountSource[],
  originalPairPriceMyr: number
): RegistrationPolicyTier[] {
  const result: RegistrationPolicyTier[] = [];
  for (let monthIndex = 1; monthIndex <= WARRANTY_MONTH_TAB_COUNT; monthIndex += 1) {
    const daysFrom = (monthIndex - 1) * FIXED_WARRANTY_MONTH_DAYS;
    if (daysFrom > maxWarrantyDays) {
      break;
    }
    let daysTo = Math.min(
      monthIndex * FIXED_WARRANTY_MONTH_DAYS - 1,
      maxWarrantyDays
    );
    if (monthIndex === WARRANTY_MONTH_TAB_COUNT) {
      daysTo = maxWarrantyDays;
    }
    result.push(
      toMonthTab(
        monthIndex,
        daysFrom,
        daysTo,
        discountPercentForDay(daysFrom, discountSources),
        originalPairPriceMyr
      )
    );
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
 * Builds Month 1–12 warranty tabs from real calendar months since purchase.
 * Month 12 extends through `maxWarrantyDays` so the full warranty year is covered.
 * Discount % is looked up from `discountSources` (API policy/discount tiers) at each month start.
 */
export function buildWarrantyMonthTabs(options: {
  purchaseDate: string;
  maxWarrantyDays: number;
  originalPairPriceMyr: number;
  discountSources: readonly DiscountSource[];
}): RegistrationPolicyTier[] {
  const {
    purchaseDate,
    maxWarrantyDays,
    originalPairPriceMyr,
    discountSources,
  } = options;

  if (
    !Number.isFinite(maxWarrantyDays) ||
    maxWarrantyDays < 0 ||
    discountSources.length === 0
  ) {
    return [];
  }

  const purchase = parsePurchaseYmd(purchaseDate);
  if (purchase === null) {
    return buildFixedThirtyDayMonthTabs(
      maxWarrantyDays,
      discountSources,
      originalPairPriceMyr
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

    result.push(
      toMonthTab(
        monthIndex,
        daysFrom,
        daysTo,
        discountPercentForDay(daysFrom, discountSources),
        originalPairPriceMyr
      )
    );

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
