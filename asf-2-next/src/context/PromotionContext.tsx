"use client";

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

/**
 * Loads and mutates promotions via Next.js API routes (service role on the server).
 */
export function PromotionProvider({
  children,
}: Readonly<PropsWithChildren>): JSX.Element {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshPromotions = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch("/api/promotions", { method: "GET" });
      const json: unknown = await res.json();
      if (!res.ok || typeof json !== "object" || json === null) {
        setPromotions([]);
        return;
      }
      const rec = json as Record<string, unknown>;
      const list = rec["promotions"];
      if (!Array.isArray(list)) {
        setPromotions([]);
        return;
      }
      setPromotions(list as Promotion[]);
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
      const res = await fetch("/api/promotions", {
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
      await refreshPromotions();
      return p as Promotion;
    },
    [refreshPromotions]
  );

  const updatePromotion = useCallback(
    async (
      id: string,
      payload: UpdatePromotionPayload
    ): Promise<Promotion | undefined> => {
      const res = await fetch(`/api/promotions/${encodeURIComponent(id)}`, {
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
      await refreshPromotions();
      return p as Promotion;
    },
    [refreshPromotions]
  );

  const deletePromotion = useCallback(
    async (id: string): Promise<void> => {
      const res = await fetch(`/api/promotions/${encodeURIComponent(id)}`, {
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
      const res = await fetch("/api/promotions/validate", {
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
      const discountValue = o["discountValue"];
      const discountAmountMyr = o["discountAmountMyr"];
      if (
        typeof promotionId !== "string" ||
        (discountType !== "percentage" && discountType !== "fixed") ||
        typeof discountValue !== "number" ||
        typeof discountAmountMyr !== "number"
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
