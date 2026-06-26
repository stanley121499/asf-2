/** Shared design tokens for all Stocks screens. */
export const C = {
  bg: "#F5F5F3",
  panel: "#FFFFFF",
  border: "#E5E5E3",
  text: "#0A0A0A",
  muted: "#6B7280",
  accent: "#C9A96E",
  danger: "#E8453C",
  dangerDark: "#DC2626",
  /** Stock level colour coding */
  stockLow: "#E8453C",
  stockMid: "#D97706",
  stockGood: "#22C55E",
} as const;

/** Returns a colour for a given stock count level. */
export function stockCountColor(count: number): string {
  if (count <= 5) return C.stockLow;
  if (count <= 20) return C.stockMid;
  return C.stockGood;
}

/** Canonical PO status values shown across the feature. */
export const PO_STATUSES = ["pending", "confirmed", "shipped", "cancelled"] as const;
export type PoStatus = (typeof PO_STATUSES)[number];

/** Canonical report status values. */
export const REPORT_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** Returns a { label, bg, color } badge descriptor for a PO status string. */
export function poBadge(status: string): { label: string; bg: string; color: string } {
  switch (status) {
    case "confirmed": return { label: "Confirmed", bg: "#D1FAE5", color: "#059669" };
    case "shipped":   return { label: "Shipped",   bg: "#E0F2FE", color: "#2563EB" };
    case "cancelled": return { label: "Cancelled", bg: "#FEE2E2", color: "#DC2626" };
    default:          return { label: "Pending",   bg: "#FDFBF7", color: "#C9A96E" };
  }
}

/** Returns a { label, bg, color } badge descriptor for a report status string. */
export function reportBadge(status: string): { label: string; bg: string; color: string } {
  switch (status) {
    case "approved": return { label: "Approved", bg: "#D1FAE5", color: "#059669" };
    case "rejected": return { label: "Rejected", bg: "#FEE2E2", color: "#DC2626" };
    default:         return { label: "Pending",  bg: "#FDFBF7", color: "#C9A96E" };
  }
}
