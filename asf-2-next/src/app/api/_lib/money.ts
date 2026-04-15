/**
 * Converts a Ringgit (MYR) decimal amount to Stripe's smallest currency unit (sen).
 * MYR uses two decimal places; amounts are rounded to the nearest sen.
 */
export function myrToSen(amountMyr: number): number {
  if (!Number.isFinite(amountMyr) || amountMyr < 0) {
    throw new Error("Invalid MYR amount");
  }
  return Math.round(amountMyr * 100);
}

/**
 * Converts Stripe amount (sen) back to MYR for database fields that store decimal ringgit.
 */
export function senToMyr(amountSen: number): number {
  if (!Number.isFinite(amountSen) || amountSen < 0) {
    throw new Error("Invalid sen amount");
  }
  return amountSen / 100;
}
