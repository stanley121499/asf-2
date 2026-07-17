/**
 * Computes whole calendar days elapsed since a purchase date (YYYY-MM-DD).
 *
 * Edge cases (documented for Agent 2+):
 * - Invalid / unparseable `purchaseDate` → returns `NaN` (callers must reject).
 * - Future purchase date → returns a **negative** number. Activate/claim APIs
 *   must reject `purchase_date > today` (design §10); do not clamp here so the
 *   API can distinguish future vs invalid.
 * - Same calendar day (local) → `0`.
 *
 * @param purchaseDate - ISO date string `YYYY-MM-DD` (or parseable date prefix)
 * @param now - Optional reference instant (defaults to current time)
 * @returns Signed whole days since purchase, or `NaN` if unparseable
 */
export function daysSincePurchase(purchaseDate: string, now: Date = new Date()): number {
  if (typeof purchaseDate !== "string" || purchaseDate.trim().length === 0) {
    return Number.NaN;
  }

  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    return Number.NaN;
  }

  const datePart = purchaseDate.trim().slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (match === null) {
    return Number.NaN;
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
    return Number.NaN;
  }

  // Interpret purchase as UTC midnight so calendar day math is timezone-stable.
  const purchaseUtc = Date.UTC(year, month - 1, day);
  const purchaseCheck = new Date(purchaseUtc);
  if (
    purchaseCheck.getUTCFullYear() !== year ||
    purchaseCheck.getUTCMonth() !== month - 1 ||
    purchaseCheck.getUTCDate() !== day
  ) {
    return Number.NaN;
  }

  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((nowUtc - purchaseUtc) / msPerDay);
}
