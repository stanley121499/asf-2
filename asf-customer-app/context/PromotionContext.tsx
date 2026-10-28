import { useFocusEffect } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import type { Database } from "@/database.types";
import { getApiBaseUrl } from "@/lib/api";
import {
  logPrioP2Blur,
  logPrioP2Fetch,
  logPrioP2Focus,
  logPrioP2Skip,
} from "@/lib/prioLog";
import { supabase } from "@/lib/supabase";

/**
 * Skip promotions network refetch on Home/Highlights re-focus when the last
 * successful fetch is newer than this window (keeps tab revisit cheap).
 */
const PROMOTIONS_P2_FRESH_MS = 5 * 60 * 1000;

/**
 * Delay before dropping the last promotions retain so Home↔Highlights handoff
 * never briefly hits retainCount 0 and re-enters the fetch effect on the
 * tab-switch critical path.
 */
const PROMOTIONS_RETAIN_RELEASE_GRACE_MS = 450;

/** Junction row linking a promotion to a product. */
export type PromotionProductLink = Database["public"]["Tables"]["promotion_products"]["Row"];

/**
 * Promotion row plus Storefront-facing `product_ids` from `promotion_products`.
 * `image_url` is on the base row for Home feed full-bleed blocks (plan §3.1 B).
 */
export type Promotion = Database["public"]["Tables"]["promotions"]["Row"] & {
  /** Linked catalog product ids for this promotion (may be empty). */
  product_ids: string[];
};

export type CreatePromotionPayload = {
  name: string;
  description?: string | null;
  code?: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  start_date?: string | null;
  end_date?: string | null;
  active?: boolean;
  max_uses?: number | null;
  product_ids: string[];
};

export type UpdatePromotionPayload = Partial<
  Omit<CreatePromotionPayload, "product_ids">
> & {
  product_ids?: string[];
};

export type ValidateResult =
  | {
      valid: true;
      promotionId: string;
      discountType: "percentage" | "fixed";
      discountValue: number;
      discountAmountMyr: number;
    }
  | { valid: false; reason: string };

type PromotionContextValue = {
  promotions: Promotion[];
  loading: boolean;
  refreshPromotions: () => Promise<void>;
  createPromotion: (
    payload: CreatePromotionPayload
  ) => Promise<Promotion | undefined>;
  updatePromotion: (
    id: string,
    payload: UpdatePromotionPayload
  ) => Promise<Promotion | undefined>;
  deletePromotion: (id: string) => Promise<void>;
  validatePromoCode: (
    code: string,
    cartLines: { product_id: string; amount: number }[]
  ) => Promise<ValidateResult>;
  /** P2: retain promotions fetch while Home / Highlights is focused. */
  retainFocus: () => () => void;
};

const PromotionContext = createContext<PromotionContextValue | undefined>(
  undefined
);

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/**
 * Builds a promotion_id → product_id[] map from `promotion_products`.
 */
async function fetchPromotionProductIdMap(): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  const { data, error } = await supabase
    .from("promotion_products")
    .select("promotion_id, product_id");

  if (error !== null) {
    if (process.env.NODE_ENV === "development") {
      console.warn("PromotionProvider: promotion_products fetch failed", error.message);
    }
    return map;
  }

  for (const row of data ?? []) {
    const promotionId = row.promotion_id;
    const productId = row.product_id;
    if (typeof promotionId !== "string" || typeof productId !== "string") {
      continue;
    }
    const existing = map.get(promotionId);
    if (existing === undefined) {
      map.set(promotionId, [productId]);
    } else {
      existing.push(productId);
    }
  }
  return map;
}

/**
 * Normalizes API/DB rows because Postgres numeric columns can arrive as strings.
 * Always includes `image_url` and `product_ids` for Storefront feed resolvers.
 *
 * @param row - Raw promotion object from API or Supabase
 * @param productIds - Linked product ids from `promotion_products` (may be empty)
 */
function normalizePromotionRow(
  row: unknown,
  productIds: readonly string[] = []
): Promotion | null {
  if (typeof row !== "object" || row === null) {
    return null;
  }

  const record = row as Record<string, unknown>;
  const id = record["id"];
  const createdAt = record["created_at"];
  const discountValue = parseFiniteNumber(record["discount_value"]);
  const maxUsesRaw = record["max_uses"];
  const usesCountRaw = record["uses_count"];
  const usesCount =
    usesCountRaw === null || usesCountRaw === undefined
      ? null
      : parseFiniteNumber(usesCountRaw);
  const minPurchase =
    parseFiniteNumber(record["minimum_purchase_amount"]) ?? 0;

  if (typeof id !== "string" || typeof createdAt !== "string" || discountValue === null) {
    return null;
  }

  if (usesCountRaw !== null && usesCountRaw !== undefined && usesCount === null) {
    return null;
  }

  const maxUses =
    maxUsesRaw === null || maxUsesRaw === undefined
      ? null
      : parseFiniteNumber(maxUsesRaw);
  if (maxUsesRaw !== null && maxUsesRaw !== undefined && maxUses === null) {
    return null;
  }

  const nameRaw = record["name"];
  const name = typeof nameRaw === "string" ? nameRaw : null;
  const codeRaw = record["code"];
  const code = typeof codeRaw === "string" ? codeRaw : "";
  const discountTypeRaw = record["discount_type"];
  const discountType =
    typeof discountTypeRaw === "string" ? discountTypeRaw : null;
  const statusRaw = record["status"];
  const status = typeof statusRaw === "string" ? statusRaw : "active";
  const typeRaw = record["type"];
  const type = typeof typeRaw === "string" ? typeRaw : "manual";

  let active: boolean | null = null;
  if (record["active"] === true) {
    active = true;
  } else if (record["active"] === false) {
    active = false;
  }

  return {
    active,
    auto_apply: record["auto_apply"] === true,
    code,
    created_at: createdAt,
    deleted_at: optionalString(record["deleted_at"]),
    description: optionalString(record["description"]),
    discount_type: discountType,
    discount_value: discountValue,
    end_date: optionalString(record["end_date"]),
    id,
    image_url: optionalString(record["image_url"]),
    max_uses: maxUses,
    minimum_purchase_amount: minPurchase,
    name,
    start_date: optionalString(record["start_date"]),
    status,
    type,
    uses_count: usesCount,
    product_ids: [...productIds],
  };
}

/**
 * Attaches `promotion_products` ids onto already-normalized promotions.
 */
async function withPromotionProductIds(
  promotions: Promotion[]
): Promise<Promotion[]> {
  if (promotions.length === 0) {
    return promotions;
  }
  const linkMap = await fetchPromotionProductIdMap();
  return promotions.map((promo) => ({
    ...promo,
    product_ids: linkMap.get(promo.id) ?? [],
  }));
}

async function fetchPromotionsFromApi(): Promise<Promotion[] | null> {
  try {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/api/promotions`, { method: "GET" });
    const json: unknown = await res.json();
    if (!res.ok || typeof json !== "object" || json === null) {
      return null;
    }
    const rec = json as Record<string, unknown>;
    const list = rec["promotions"];
    if (!Array.isArray(list)) {
      return null;
    }
    const normalized = list
      .map((row) => normalizePromotionRow(row, []))
      .filter((p): p is Promotion => p !== null);
    return withPromotionProductIds(normalized);
  } catch {
    return null;
  }
}

async function fetchPromotionsFromSupabase(): Promise<Promotion[]> {
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error !== null) {
    if (process.env.NODE_ENV === "development") {
      console.warn("PromotionProvider: fallback fetch failed", error.message);
    }
    return [];
  }

  const normalized = (data ?? [])
    .map((row) => normalizePromotionRow(row, []))
    .filter((p): p is Promotion => p !== null);
  return withPromotionProductIds(normalized);
}

/**
 * Loads and mutates promotions via Next.js API routes (service role on the server).
 * Initial list fetch runs only while a screen holds {@link retainFocus} (P2) —
 * typically Home / Highlights, which need promos for the feed.
 */
export function PromotionProvider({
  children,
}: Readonly<PropsWithChildren>): React.ReactElement {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [retainCount, setRetainCount] = useState(0);
  /** Epoch ms of last successful promotions fetch (0 = never). */
  const lastFetchedAtRef = useRef(0);
  /** True after at least one fetch attempt finished (success or empty). */
  const hasFetchedRef = useRef(false);
  /** Mirrors retainCount for sync bump/release without waiting on render. */
  const retainCountRef = useRef(0);
  /** Releases queued inside the grace window (flushed together when timer fires). */
  const pendingReleaseCountRef = useRef(0);
  /** Pending deferred release timer for grace-period handoff. */
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** True while a promotions network fetch is in flight (dedupes retain + effect). */
  const fetchInFlightRef = useRef(false);

  /**
   * Loads promotions from API / Supabase.
   * When `silent` is true and we already have a prior fetch, skips the
   * `loading` flag so Home does not re-render for a background refresh.
   *
   * @param options.silent - Prefer silent refresh after the first hydrate
   */
  const refreshPromotions = useCallback(
    async (options?: { silent?: boolean }): Promise<void> => {
      const silent = options?.silent === true && hasFetchedRef.current;
      if (!silent) {
        setLoading(true);
      }
      logPrioP2Fetch("promotions", silent ? "silent" : "blocking");
      try {
        const apiPromotions = await fetchPromotionsFromApi();
        const nextPromotions =
          apiPromotions !== null
            ? apiPromotions
            : await fetchPromotionsFromSupabase();
        setPromotions(nextPromotions);
        lastFetchedAtRef.current = Date.now();
        hasFetchedRef.current = true;
      } catch {
        setPromotions([]);
        lastFetchedAtRef.current = Date.now();
        hasFetchedRef.current = true;
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    []
  );

  /**
   * Starts a promotions fetch when cache is missing/stale; TTL-skips when fresh.
   * Invoked from retain (primary) and the isRetained effect (safety net).
   */
  const hydratePromotionsIfNeeded = useCallback((): void => {
    if (fetchInFlightRef.current) {
      return;
    }
    const now = Date.now();
    const ageMs = now - lastFetchedAtRef.current;
    if (
      hasFetchedRef.current &&
      ageMs >= 0 &&
      ageMs < PROMOTIONS_P2_FRESH_MS
    ) {
      logPrioP2Skip(
        "promotions",
        `fresh ${String(Math.round(ageMs))}ms < ${String(PROMOTIONS_P2_FRESH_MS)}ms`
      );
      return;
    }
    fetchInFlightRef.current = true;
    void refreshPromotions({ silent: hasFetchedRef.current }).finally(() => {
      fetchInFlightRef.current = false;
    });
  }, [refreshPromotions]);

  /**
   * P2 retain with deferred release so Home↔Highlights handoff does not drop
   * to retainCount 0 on the tab-switch critical path.
   * Hydrates immediately on retain so Highlights can TTL-skip after Home focus.
   */
  const retainFocus = useCallback((): (() => void) => {
    if (pendingReleaseCountRef.current > 0) {
      // Consume a grace-pending release slot instead of bumping count (handoff).
      pendingReleaseCountRef.current -= 1;
      if (
        pendingReleaseCountRef.current === 0 &&
        releaseTimerRef.current !== null
      ) {
        clearTimeout(releaseTimerRef.current);
        releaseTimerRef.current = null;
      }
    } else {
      retainCountRef.current += 1;
      setRetainCount(retainCountRef.current);
    }

    hydratePromotionsIfNeeded();

    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      pendingReleaseCountRef.current += 1;
      if (releaseTimerRef.current !== null) {
        clearTimeout(releaseTimerRef.current);
      }
      releaseTimerRef.current = setTimeout(() => {
        releaseTimerRef.current = null;
        const pending = pendingReleaseCountRef.current;
        pendingReleaseCountRef.current = 0;
        if (pending <= 0) {
          return;
        }
        retainCountRef.current = Math.max(0, retainCountRef.current - pending);
        setRetainCount(retainCountRef.current);
      }, PROMOTIONS_RETAIN_RELEASE_GRACE_MS);
    };
  }, [hydratePromotionsIfNeeded]);

  useEffect(() => {
    return () => {
      if (releaseTimerRef.current !== null) {
        clearTimeout(releaseTimerRef.current);
        releaseTimerRef.current = null;
      }
    };
  }, []);

  /** True while any screen holds retain (boolean — avoids effect churn on 1↔2). */
  const isRetained = retainCount > 0;

  useEffect(() => {
    if (!isRetained) {
      return;
    }
    hydratePromotionsIfNeeded();
  }, [hydratePromotionsIfNeeded, isRetained]);

  const createPromotion = useCallback(
    async (payload: CreatePromotionPayload): Promise<Promotion | undefined> => {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/promotions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: unknown = await res.json();
      if (!res.ok || typeof json !== "object" || json === null) {
        return undefined;
      }
      const rec = json as Record<string, unknown>;
      const p = rec["promotion"];
      if (typeof p !== "object" || p === null) {
        return undefined;
      }
      const normalized = normalizePromotionRow(p);
      await refreshPromotions();
      return normalized ?? undefined;
    },
    [refreshPromotions]
  );

  const updatePromotion = useCallback(
    async (
      id: string,
      payload: UpdatePromotionPayload
    ): Promise<Promotion | undefined> => {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/promotions/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: unknown = await res.json();
      if (!res.ok || typeof json !== "object" || json === null) {
        return undefined;
      }
      const rec = json as Record<string, unknown>;
      const p = rec["promotion"];
      if (typeof p !== "object" || p === null) {
        return undefined;
      }
      const normalized = normalizePromotionRow(p);
      await refreshPromotions();
      return normalized ?? undefined;
    },
    [refreshPromotions]
  );

  const deletePromotion = useCallback(
    async (id: string): Promise<void> => {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/promotions/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshPromotions();
      }
    },
    [refreshPromotions]
  );

  const validatePromoCode = useCallback(
    async (
      code: string,
      cartLines: { product_id: string; amount: number }[]
    ): Promise<ValidateResult> => {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/promotions/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, cartLines }),
      });
      const json: unknown = await res.json();
      if (typeof json !== "object" || json === null) {
        return { valid: false, reason: "Invalid response" };
      }
      const o = json as Record<string, unknown>;
      const valid = o["valid"];
      if (valid === false) {
        const reason = o["reason"];
        return {
          valid: false,
          reason: typeof reason === "string" ? reason : "Invalid promo code",
        };
      }
      if (valid !== true) {
        return { valid: false, reason: "Invalid response" };
      }
      const promotionId = o["promotionId"];
      const discountType = o["discountType"];
      const discountValue = parseFiniteNumber(o["discountValue"]);
      const discountAmountMyr = parseFiniteNumber(o["discountAmountMyr"]);
      if (
        typeof promotionId !== "string" ||
        (discountType !== "percentage" && discountType !== "fixed") ||
        discountValue === null ||
        discountAmountMyr === null
      ) {
        return { valid: false, reason: "Invalid response" };
      }
      return {
        valid: true,
        promotionId,
        discountType,
        discountValue,
        discountAmountMyr,
      };
    },
    []
  );

  const value = useMemo(
    (): PromotionContextValue => ({
      promotions,
      loading,
      refreshPromotions,
      createPromotion,
      updatePromotion,
      deletePromotion,
      validatePromoCode,
      retainFocus,
    }),
    [
      promotions,
      loading,
      refreshPromotions,
      createPromotion,
      updatePromotion,
      deletePromotion,
      validatePromoCode,
      retainFocus,
    ]
  );

  return (
    <PromotionContext.Provider value={value}>
      {children}
    </PromotionContext.Provider>
  );
}

export function usePromotionContext(): PromotionContextValue {
  const ctx = useContext(PromotionContext);
  if (ctx === undefined) {
    throw new Error("usePromotionContext must be used within PromotionProvider");
  }
  return ctx;
}

/**
 * Returns promotion context when inside {@link PromotionProvider}; otherwise `null`.
 * Use on screens that mount whether or not the `promotions` feature flag is on
 * (provider is Gate-wrapped in `RouteContextBundle`).
 */
export function useOptionalPromotionContext(): PromotionContextValue | null {
  const ctx = useContext(PromotionContext);
  return ctx ?? null;
}

/**
 * P2: promotions fetch while this screen is focused.
 * No-ops when the promotions feature flag gate omitted the provider.
 *
 * Uses `setTimeout(0)` instead of shared P2 idle deferral (`requestIdleCallback`,
 * up to 2s) so Home hydrate is not starved by catalog/wishlist work and cancelled
 * on blur before retain — Metro showed Home focus with no fetch/skip.
 * Still deferred one macrotask so navigate→focus can commit first.
 *
 * @param name - Greppable resource label for `[prio] P2 focus|blur` logs
 */
export function usePromotionP2Focus(name: string = "promotions"): void {
  const ctx = useOptionalPromotionContext();
  const retainFocusRef = useRef(ctx?.retainFocus);
  retainFocusRef.current = ctx?.retainFocus;
  /** Re-subscribe when the gated provider appears after first focus. */
  const providerAvailable = ctx !== null;

  useFocusEffect(
    useCallback(() => {
      logPrioP2Focus(name);
      let release: (() => void) | undefined;
      let released = false;
      let cancelled = false;

      const timeoutId = setTimeout(() => {
        if (cancelled) {
          return;
        }
        const retainFocus = retainFocusRef.current;
        if (retainFocus === undefined) {
          return;
        }
        release = retainFocus();
      }, 0);

      return () => {
        cancelled = true;
        clearTimeout(timeoutId);
        logPrioP2Blur(name);
        if (!released && release !== undefined) {
          released = true;
          release();
        }
      };
    }, [name, providerAvailable])
  );
}
