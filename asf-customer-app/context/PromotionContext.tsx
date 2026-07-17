import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { Database } from "@/database.types";
import { getApiBaseUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export type Promotion = Database["public"]["Tables"]["promotions"]["Row"];

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
 * Normalizes API rows because Postgres numeric columns can arrive as strings.
 */
function normalizePromotionRow(row: unknown): Promotion | null {
  if (typeof row !== "object" || row === null) {
    return null;
  }

  const record = row as Record<string, unknown>;
  const id = record["id"];
  const name = record["name"];
  const createdAt = record["created_at"];
  const discountType = record["discount_type"];
  const discountValue = parseFiniteNumber(record["discount_value"]);
  const maxUsesRaw = record["max_uses"];
  const usesCount = parseFiniteNumber(record["uses_count"]);

  if (
    typeof id !== "string" ||
    typeof name !== "string" ||
    typeof createdAt !== "string" ||
    typeof discountType !== "string" ||
    discountValue === null ||
    usesCount === null
  ) {
    return null;
  }

  const maxUses =
    maxUsesRaw === null || maxUsesRaw === undefined
      ? null
      : parseFiniteNumber(maxUsesRaw);
  if (maxUsesRaw !== null && maxUsesRaw !== undefined && maxUses === null) {
    return null;
  }

  return {
    active: record["active"] === true,
    code: optionalString(record["code"]),
    created_at: createdAt,
    deleted_at: optionalString(record["deleted_at"]),
    description: optionalString(record["description"]),
    discount_type: discountType,
    discount_value: discountValue,
    end_date: optionalString(record["end_date"]),
    id,
    max_uses: maxUses,
    name,
    start_date: optionalString(record["start_date"]),
    uses_count: usesCount,
  };
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
    return list.map(normalizePromotionRow).filter((p) => p !== null);
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

  return (data ?? []).map(normalizePromotionRow).filter((p) => p !== null);
}

/**
 * Loads and mutates promotions via Next.js API routes (service role on the server).
 */
export function PromotionProvider({
  children,
}: Readonly<PropsWithChildren>): React.ReactElement {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshPromotions = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const apiPromotions = await fetchPromotionsFromApi();
      const nextPromotions =
        apiPromotions !== null ? apiPromotions : await fetchPromotionsFromSupabase();
      setPromotions(nextPromotions);
    } catch {
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPromotions();
  }, [refreshPromotions]);

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
    }),
    [
      promotions,
      loading,
      refreshPromotions,
      createPromotion,
      updatePromotion,
      deletePromotion,
      validatePromoCode,
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
