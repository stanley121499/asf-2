/**
 * Runtime helpers for dealing with soft-delete fields when TypeScript types
 * are not yet regenerated from the database schema.
 *
 * IMPORTANT:
 * - We avoid `any`, non-null assertions, and `as unknown as T`.
 * - These helpers let the UI safely read `deleted_at` from rows returned by Supabase
 *   even if `database.types.ts` is temporarily out of sync.
 */

/**
 * Narrow an unknown value to a plain object record.
 *
 * @param value - Value to check.
 * @returns True if value is a non-null object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Extract `deleted_at` from an arbitrary row payload, with validation.
 *
 * @param value - Row-like value (Supabase row, realtime payload row, etc.).
 * @returns The ISO string when present, null when explicitly null, or null when absent/invalid.
 */
export function readDeletedAt(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  const raw = value["deleted_at"];
  if (raw === null) {
    return null;
  }
  if (typeof raw === "string") {
    return raw.length > 0 ? raw : null;
  }
  return null;
}

/**
 * Determine whether a row is soft deleted.
 *
 * @param value - Row-like value (Supabase row, realtime payload row, etc.).
 * @returns True when `deleted_at` is a non-empty string.
 */
export function isSoftDeletedRow(value: unknown): boolean {
  return readDeletedAt(value) !== null;
}



