/**
 * Rounds MYR to two decimal places.
 */
export function roundMyr(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Computes fixed RM credit from line item price and approved percent.
 */
export function calculateCreditAmount(lineItemPriceMyr: number, approvedPercent: number): number {
  if (!Number.isFinite(lineItemPriceMyr) || lineItemPriceMyr < 0) {
    return 0;
  }
  if (!Number.isFinite(approvedPercent) || approvedPercent < 0) {
    return 0;
  }
  const cappedPercent = Math.min(approvedPercent, 100);
  return roundMyr((lineItemPriceMyr * cappedPercent) / 100);
}
