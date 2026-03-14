import { supabase } from "./supabaseClient";
import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Tables in this application that support soft delete via a `deleted_at` column.
 *
 * IMPORTANT:
 * - Do NOT include transactional/audit tables here (orders, order_items, payments, *_logs).
 * - `add_to_carts` is intentionally excluded (temporary data; hard delete is OK).
 */
export type SoftDeletableTable =
  | "products"
  | "product_colors"
  | "product_sizes"
  | "categories"
  | "brand"
  | "departments"
  | "ranges"
  | "posts"
  | "product_folders"
  | "post_folders";

/**
 * Subset of soft deletable tables that also have an `active` flag we want to toggle
 * on delete/restore for better UI consistency.
 */
export type SoftDeletableTableWithActive =
  | "product_colors"
  | "product_sizes"
  | "categories"
  | "brand"
  | "departments"
  | "ranges"
  | "posts"
  | "product_folders"
  | "post_folders";

/**
 * Minimal interface for a Supabase query builder that supports `.is("deleted_at", null)`.
 * This lets us avoid `any` while staying compatible with Supabase's fluent API.
 */
export interface SoftDeleteFilterableQuery<TQuery> {
  is: (column: "deleted_at", value: null) => TQuery;
}

/**
 * Adds a soft-delete filter to a query builder.
 *
 * @param query - Supabase query builder instance.
 * @param includeDeleted - When true, do not apply the filter.
 * @returns The same query builder (optionally filtered).
 */
export function withSoftDelete<TQuery extends SoftDeleteFilterableQuery<TQuery>>(
  query: TQuery,
  includeDeleted: boolean = false
): TQuery {
  if (includeDeleted) {
    return query;
  }
  return query.is("deleted_at", null);
}

/**
 * Options for soft delete / restore helpers.
 */
export interface SoftDeleteOptions {
  /**
   * When true, also toggle `active` to false/true if the table supports it.
   * This is helpful because many UI queries filter by `active` already.
   */
  setActive?: boolean;
}

/**
 * Runtime type guard for tables supporting an `active` column.
 *
 * @param table - Table name.
 * @returns True when `table` is in the active-aware allowlist.
 */
// NOTE: We intentionally do not rely on runtime table checks here; the switch below
// uses per-table payloads to stay aligned with Supabase's generated types.

/**
 * Convert a Supabase error object into a proper Error instance.
 *
 * @param message - High-level message.
 * @param error - Supabase PostgREST error.
 * @returns Error suitable for throwing/logging.
 */
function toError(message: string, error: PostgrestError): Error {
  return new Error(`${message}: ${error.message}`);
}

/**
 * Soft deletes a record by setting `deleted_at` (and optionally `active=false`).
 *
 * @param table - Soft-deletable table name.
 * @param id - Record UUID.
 * @param options - Behavior flags (e.g., also toggle active).
 * @throws Error when validation fails or the database update fails.
 */
export async function softDeleteById<TTable extends SoftDeletableTable>(
  table: TTable,
  id: string,
  options: SoftDeleteOptions = {}
): Promise<void> {
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new Error("softDeleteById requires a non-empty id.");
  }

  const deletedAtIso = new Date().toISOString();

  // Build a per-table payload so Supabase's typed `.update()` always accepts it.
  // IMPORTANT: `products` does not have `active` in some deployments, so we never set it here.
  let error: PostgrestError | null = null;

  switch (table) {
    case "products": {
      const res = await supabase
        .from("products")
        .update({ deleted_at: deletedAtIso })
        .eq("id", id);
      error = res.error;
      break;
    }
    case "product_colors": {
      const payload = options.setActive ? { deleted_at: deletedAtIso, active: false } : { deleted_at: deletedAtIso };
      const res = await supabase.from("product_colors").update(payload).eq("id", id);
      error = res.error;
      break;
    }
    case "product_sizes": {
      const payload = options.setActive ? { deleted_at: deletedAtIso, active: false } : { deleted_at: deletedAtIso };
      const res = await supabase.from("product_sizes").update(payload).eq("id", id);
      error = res.error;
      break;
    }
    case "categories": {
      const payload = options.setActive ? { deleted_at: deletedAtIso, active: false } : { deleted_at: deletedAtIso };
      const res = await supabase.from("categories").update(payload).eq("id", id);
      error = res.error;
      break;
    }
    case "brand": {
      const payload = options.setActive ? { deleted_at: deletedAtIso, active: false } : { deleted_at: deletedAtIso };
      const res = await supabase.from("brand").update(payload).eq("id", id);
      error = res.error;
      break;
    }
    case "departments": {
      const payload = options.setActive ? { deleted_at: deletedAtIso, active: false } : { deleted_at: deletedAtIso };
      const res = await supabase.from("departments").update(payload).eq("id", id);
      error = res.error;
      break;
    }
    case "ranges": {
      const payload = options.setActive ? { deleted_at: deletedAtIso, active: false } : { deleted_at: deletedAtIso };
      const res = await supabase.from("ranges").update(payload).eq("id", id);
      error = res.error;
      break;
    }
    case "posts": {
      const payload = options.setActive ? { deleted_at: deletedAtIso, active: false } : { deleted_at: deletedAtIso };
      const res = await supabase.from("posts").update(payload).eq("id", id);
      error = res.error;
      break;
    }
    case "product_folders": {
      const payload = options.setActive
        ? { deleted_at: deletedAtIso, active: false }
        : { deleted_at: deletedAtIso };
      const res = await supabase.from("product_folders").update(payload).eq("id", id);
      error = res.error;
      break;
    }
    case "post_folders": {
      const payload = options.setActive ? { deleted_at: deletedAtIso, active: false } : { deleted_at: deletedAtIso };
      const res = await supabase.from("post_folders").update(payload).eq("id", id);
      error = res.error;
      break;
    }
    default: {
      // Defensive fallback; should be unreachable due to the union type.
      throw new Error("Unsupported table for soft delete.");
    }
  }
  if (error) {
    throw toError(`Failed to soft delete ${table} record`, error);
  }
}

/**
 * Restores a soft-deleted record by setting `deleted_at` back to NULL
 * (and optionally `active=true`).
 *
 * @param table - Soft-deletable table name.
 * @param id - Record UUID.
 * @param options - Behavior flags (e.g., also toggle active).
 * @throws Error when validation fails or the database update fails.
 */
export async function restoreById<TTable extends SoftDeletableTable>(
  table: TTable,
  id: string,
  options: SoftDeleteOptions = {}
): Promise<void> {
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new Error("restoreById requires a non-empty id.");
  }

  let error: PostgrestError | null = null;

  switch (table) {
    case "products": {
      const res = await supabase.from("products").update({ deleted_at: null }).eq("id", id);
      error = res.error;
      break;
    }
    case "product_colors": {
      const payload = options.setActive ? { deleted_at: null, active: true } : { deleted_at: null };
      const res = await supabase.from("product_colors").update(payload).eq("id", id);
      error = res.error;
      break;
    }
    case "product_sizes": {
      const payload = options.setActive ? { deleted_at: null, active: true } : { deleted_at: null };
      const res = await supabase.from("product_sizes").update(payload).eq("id", id);
      error = res.error;
      break;
    }
    case "categories": {
      const payload = options.setActive ? { deleted_at: null, active: true } : { deleted_at: null };
      const res = await supabase.from("categories").update(payload).eq("id", id);
      error = res.error;
      break;
    }
    case "brand": {
      const payload = options.setActive ? { deleted_at: null, active: true } : { deleted_at: null };
      const res = await supabase.from("brand").update(payload).eq("id", id);
      error = res.error;
      break;
    }
    case "departments": {
      const payload = options.setActive ? { deleted_at: null, active: true } : { deleted_at: null };
      const res = await supabase.from("departments").update(payload).eq("id", id);
      error = res.error;
      break;
    }
    case "ranges": {
      const payload = options.setActive ? { deleted_at: null, active: true } : { deleted_at: null };
      const res = await supabase.from("ranges").update(payload).eq("id", id);
      error = res.error;
      break;
    }
    case "posts": {
      const payload = options.setActive ? { deleted_at: null, active: true } : { deleted_at: null };
      const res = await supabase.from("posts").update(payload).eq("id", id);
      error = res.error;
      break;
    }
    case "product_folders": {
      const payload = options.setActive ? { deleted_at: null, active: true } : { deleted_at: null };
      const res = await supabase.from("product_folders").update(payload).eq("id", id);
      error = res.error;
      break;
    }
    case "post_folders": {
      const payload = options.setActive ? { deleted_at: null, active: true } : { deleted_at: null };
      const res = await supabase.from("post_folders").update(payload).eq("id", id);
      error = res.error;
      break;
    }
    default: {
      throw new Error("Unsupported table for restore.");
    }
  }
  if (error) {
    throw toError(`Failed to restore ${table} record`, error);
  }
}


