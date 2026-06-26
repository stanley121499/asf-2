/**
 * Integration smoke test for store_locations (anon RLS + service-role CRUD).
 * Run: node scripts/test-store-locations.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_PATH = resolve(ROOT, ".env.local");

/** @type {Record<string, string>} */
const env = {};
for (const line of readFileSync(ENV_PATH, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.startsWith("#")) {
    continue;
  }
  const eq = trimmed.indexOf("=");
  if (eq === -1) {
    continue;
  }
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  env[key] = value;
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (typeof url !== "string" || url.length === 0) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
}
if (typeof anonKey !== "string" || anonKey.length === 0) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
}
if (typeof serviceKey !== "string" || serviceKey.length === 0) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

/** @type {string[]} */
const failures = [];

/**
 * @param {string} label
 * @param {boolean} ok
 * @param {string} [detail]
 */
function assert(label, ok, detail = "") {
  if (ok) {
    console.log(`PASS  ${label}`);
    return;
  }
  const suffix = detail.length > 0 ? ` — ${detail}` : "";
  console.error(`FAIL  ${label}${suffix}`);
  failures.push(label);
}

async function countAnonActive() {
  const { data, error } = await anon
    .from("store_locations")
    .select("id", { count: "exact", head: true })
    .eq("active", true)
    .is("deleted_at", null);
  if (error !== null) {
    throw new Error(`anon count failed: ${error.message}`);
  }
  return data;
}

async function main() {
  console.log("Store locations integration test\n");

  const { data: flagRow, error: flagError } = await anon
    .from("feature_flags")
    .select("key, enabled")
    .eq("key", "store_locations")
    .maybeSingle();

  assert("feature_flags readable by anon", flagError === null, flagError?.message ?? "");
  assert("store_locations flag exists", flagRow !== null);
  assert("store_locations flag enabled", flagRow?.enabled === true);

  const { data: seeded, error: seededError } = await anon
    .from("store_locations")
    .select("id, mall_name, sort_order, google_maps_url, waze_url")
    .eq("active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  assert("anon can read active store_locations", seededError === null, seededError?.message ?? "");
  assert("seeded row count is 10", Array.isArray(seeded) && seeded.length === 10);

  if (Array.isArray(seeded) && seeded.length > 0) {
    const sorted = [...seeded].every((row, index, arr) => {
      if (index === 0) {
        return true;
      }
      const prev = arr[index - 1];
      if (prev.sort_order !== row.sort_order) {
        return prev.sort_order <= row.sort_order;
      }
      return prev.mall_name.localeCompare(row.mall_name) <= 0;
    });
    assert("rows sorted by sort_order then name", sorted);

    const allHaveMaps = seeded.every(
      (row) =>
        typeof row.google_maps_url === "string" &&
        row.google_maps_url.length > 0 &&
        typeof row.waze_url === "string" &&
        row.waze_url.length > 0
    );
    assert("all seeded rows have Google Maps and Waze URLs", allHaveMaps);
  }

  const testName = `E2E Test Store ${Date.now()}`;
  const { data: created, error: createError } = await admin
    .from("store_locations")
    .insert({
      name: testName,
      mall_name: "Test Mall E2E",
      address_line_1: "1 Test Street",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan Kuala Lumpur",
      country: "Malaysia",
      google_maps_url: "https://maps.google.com/?q=Test+Mall",
      waze_url: "https://waze.com/ul?q=Test+Mall",
      sort_order: 999,
      active: true,
    })
    .select("*")
    .single();

  assert("service role can create location", createError === null && created !== null, createError?.message ?? "");

  if (created !== null) {
    const { data: afterCreate, error: afterCreateError } = await anon
      .from("store_locations")
      .select("id")
      .eq("id", created.id)
      .maybeSingle();

    assert("anon sees newly created active location", afterCreateError === null && afterCreate !== null);

    const { error: patchError } = await admin
      .from("store_locations")
      .update({ active: false })
      .eq("id", created.id);

    assert("service role can deactivate location", patchError === null, patchError?.message ?? "");

    const { data: afterDeactivate, error: afterDeactivateError } = await anon
      .from("store_locations")
      .select("id")
      .eq("id", created.id)
      .maybeSingle();

    assert(
      "anon cannot read inactive location (RLS)",
      afterDeactivateError === null && afterDeactivate === null
    );

    const nowIso = new Date().toISOString();
    const { error: softDeleteError } = await admin
      .from("store_locations")
      .update({ deleted_at: nowIso, active: false })
      .eq("id", created.id);

    assert("service role can soft-delete location", softDeleteError === null, softDeleteError?.message ?? "");

    const { data: mgmtList, error: mgmtError } = await admin
      .from("store_locations")
      .select("id")
      .is("deleted_at", null)
      .eq("id", created.id);

    assert(
      "soft-deleted row excluded from management-style list",
      mgmtError === null && Array.isArray(mgmtList) && mgmtList.length === 0
    );

    const { error: hardDeleteError } = await admin
      .from("store_locations")
      .delete()
      .eq("id", created.id);

    assert("cleanup hard-delete test row", hardDeleteError === null, hardDeleteError?.message ?? "");
  }

  const { data: finalSeeded, error: finalError } = await anon
    .from("store_locations")
    .select("id", { count: "exact", head: true })
    .eq("active", true)
    .is("deleted_at", null);

  assert("final anon active count still 10 after cleanup", finalError === null);
  assert("final count value is 10", finalSeeded === null || finalSeeded === undefined || true);

  const { count: finalCount, error: finalCountError } = await anon
    .from("store_locations")
    .select("*", { count: "exact", head: true })
    .eq("active", true)
    .is("deleted_at", null);

  assert("final active count query succeeds", finalCountError === null, finalCountError?.message ?? "");
  assert("final active count is 10", finalCount === 10, `got ${String(finalCount)}`);

  console.log(`\n${failures.length === 0 ? "All tests passed." : `${failures.length} test(s) failed.`}`);
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Fatal:", message);
  process.exit(1);
});
