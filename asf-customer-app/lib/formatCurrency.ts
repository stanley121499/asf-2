/**
 * Formats an amount as Malaysian Ringgit for customer-facing UI.
 */
export function formatRm(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "—";
  }
  return `RM ${amount.toFixed(2)}`;
}
