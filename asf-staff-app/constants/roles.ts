import type { Database } from "@/database.types";

/** Row type for `staff_roles` — single source from generated DB types. */
export type StaffRoleRow = Database["public"]["Tables"]["staff_roles"]["Row"];

/**
 * Allowed staff roles (must match `staff_roles` + RLS; DB column is `string`).
 */
export const STAFF_ROLES = [
  "owner",
  "manager",
  "staff",
  "warehouse",
  "support",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

/**
 * Parses a DB role string into `StaffRole`, or null when unsupported.
 */
export function parseStaffRole(value: string): StaffRole | null {
  const t = value.trim();
  for (const r of STAFF_ROLES) {
    if (r === t) {
      return r;
    }
  }
  return null;
}

/** Tab configuration per role (see STAFF_APP_PROMPT). */
export const ROLE_TAB_ORDER: Record<
  StaffRole,
  readonly string[]
> = {
  owner:     ["dashboard", "orders", "products", "analytics", "chat"],
  manager:   ["orders", "products", "posts", "analytics", "chat"],
  staff:     ["orders", "stocks", "chat"],
  warehouse: ["products", "stocks", "chat"],
  support:   ["orders", "chat"],
};
