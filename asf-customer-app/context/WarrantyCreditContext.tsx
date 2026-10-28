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

import { useAuthContext } from "@/context/AuthContext";
import type { Tables } from "@/database.types";
import { logPrioP2Fetch, logPrioP2Skip } from "@/lib/prioLog";
import { useP2FocusRetain } from "@/lib/useP2FocusRetain";
import { roundMyr } from "@/lib/warranty/calculateCreditAmount";
import { supabase } from "@/lib/supabase";

/**
 * Skip warranty-credits network refetch on re-focus when the last successful
 * fetch for this user is newer than this window.
 */
const WARRANTY_CREDITS_P2_FRESH_MS = 5 * 60 * 1000;

type WarrantyCreditRow = Tables<"warranty_credits">;

export type WarrantyCreditView = {
  id: string;
  amountMyr: number;
  approvedPercent: number;
  status: string;
  expiresAt: string;
  usedAt: string | null;
  claimId: string | null;
  claimItemId: string | null;
  productName: string;
};

type WarrantyCreditContextValue = {
  credits: WarrantyCreditView[];
  loading: boolean;
  refreshCredits: () => Promise<void>;
  applyCreditToCart: (
    creditId: string,
    cartSubtotalMyr: number
  ) => Promise<{ valid: true; discountAmountMyr: number } | { valid: false; reason: string }>;
  /** P2: retain credit list fetch while warranty-credits or cart is focused. */
  retainFocus: () => () => void;
};

const WarrantyCreditContext = createContext<WarrantyCreditContextValue | undefined>(
  undefined
);

type CreditRowWithProduct = WarrantyCreditRow & {
  claim_items: {
    product_id: string | null;
    products: { name: string } | null;
  } | null;
};

/**
 * Type predicate for a joined warranty_credits select row.
 *
 * @param row - Raw Supabase select row
 * @returns True when the row has the fields {@link mapCreditRow} needs
 */
function isCreditRowWithProduct(row: unknown): row is CreditRowWithProduct {
  if (typeof row !== "object" || row === null) {
    return false;
  }
  if (!("id" in row) || typeof row.id !== "string") {
    return false;
  }
  if (!("amount_myr" in row) || !("approved_percent" in row)) {
    return false;
  }
  if (!("status" in row) || typeof row.status !== "string") {
    return false;
  }
  if (!("expires_at" in row) || typeof row.expires_at !== "string") {
    return false;
  }
  return true;
}

/**
 * Maps a joined warranty_credits row to a customer-facing view.
 */
function mapCreditRow(row: CreditRowWithProduct): WarrantyCreditView {
  const productName = row.claim_items?.products?.name ?? "Product";
  return {
    id: row.id,
    amountMyr: Number(row.amount_myr),
    approvedPercent: Number(row.approved_percent),
    status: row.status,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    claimId: row.claim_id,
    claimItemId: row.claim_item_id,
    productName,
  };
}

/**
 * Fetches warranty credits for the authenticated customer via Supabase RLS.
 * List fetch runs only while a screen holds {@link retainFocus} (P2).
 */
export function WarrantyCreditProvider({
  children,
}: Readonly<PropsWithChildren>): React.ReactElement {
  const { user } = useAuthContext();
  const [credits, setCredits] = useState<WarrantyCreditView[]>([]);
  const [loading, setLoading] = useState(false);
  const [retainCount, setRetainCount] = useState(0);
  /** Epoch ms of last completed credits fetch (0 = never). */
  const lastFetchedAtRef = useRef(0);
  /** User id the last fetch belonged to (null = none). */
  const lastFetchedUserIdRef = useRef<string | null>(null);
  /** True after at least one fetch attempt finished for the current user. */
  const hasFetchedRef = useRef(false);

  const refreshCredits = useCallback(async (): Promise<void> => {
    if (user === null) {
      setCredits([]);
      lastFetchedAtRef.current = 0;
      lastFetchedUserIdRef.current = null;
      hasFetchedRef.current = false;
      return;
    }
    setLoading(true);
    logPrioP2Fetch("warranty_credits", "blocking");
    try {
      // Disambiguate: claim_items ↔ warranty_credits has two FKs
      // (warranty_credits.claim_item_id and claim_items.warranty_credit_id).
      const { data, error } = await supabase
        .from("warranty_credits")
        .select(
          "*, claim_items!warranty_credits_claim_item_id_fkey(product_id, products(name))"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error !== null) {
        console.warn("WarrantyCreditProvider: fetch failed", error.message);
        setCredits([]);
        lastFetchedAtRef.current = Date.now();
        lastFetchedUserIdRef.current = user.id;
        hasFetchedRef.current = true;
        return;
      }

      const rows: CreditRowWithProduct[] = [];
      for (const entry of data ?? []) {
        if (isCreditRowWithProduct(entry)) {
          rows.push(entry);
        }
      }
      setCredits(rows.map(mapCreditRow));
      lastFetchedAtRef.current = Date.now();
      lastFetchedUserIdRef.current = user.id;
      hasFetchedRef.current = true;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const retainFocus = useCallback((): (() => void) => {
    setRetainCount((count) => count + 1);
    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      setRetainCount((count) => Math.max(0, count - 1));
    };
  }, []);

  /** True while any screen holds retain (boolean — avoids effect churn on 1↔2). */
  const isRetained = retainCount > 0;
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!isRetained) {
      return;
    }

    const now = Date.now();
    const ageMs = now - lastFetchedAtRef.current;
    const sameUser =
      typeof userId === "string" && lastFetchedUserIdRef.current === userId;
    if (
      hasFetchedRef.current &&
      sameUser &&
      ageMs >= 0 &&
      ageMs < WARRANTY_CREDITS_P2_FRESH_MS
    ) {
      logPrioP2Skip(
        "warranty_credits",
        `fresh ${String(Math.round(ageMs))}ms < ${String(WARRANTY_CREDITS_P2_FRESH_MS)}ms`
      );
      return;
    }
    void refreshCredits();
  }, [refreshCredits, isRetained, userId]);

  const applyCreditToCart = useCallback(
    async (
      creditId: string,
      cartSubtotalMyr: number
    ): Promise<{ valid: true; discountAmountMyr: number } | { valid: false; reason: string }> => {
      if (user === null) {
        return { valid: false, reason: "Please sign in." };
      }

      const credit = credits.find((c) => c.id === creditId);
      if (credit === undefined) {
        return { valid: false, reason: "Credit not found." };
      }

      if (credit.status !== "active") {
        return { valid: false, reason: "This credit is no longer active." };
      }

      const expiresMs = new Date(credit.expiresAt).getTime();
      if (Number.isFinite(expiresMs) && expiresMs < Date.now()) {
        return { valid: false, reason: "This credit has expired." };
      }

      if (!Number.isFinite(cartSubtotalMyr) || cartSubtotalMyr <= 0) {
        return { valid: false, reason: "Cart is empty." };
      }

      const discountAmountMyr = roundMyr(Math.min(credit.amountMyr, cartSubtotalMyr));
      if (discountAmountMyr <= 0) {
        return { valid: false, reason: "Credit cannot be applied to this cart." };
      }

      return { valid: true, discountAmountMyr };
    },
    [credits, user]
  );

  const value = useMemo(
    (): WarrantyCreditContextValue => ({
      credits,
      loading,
      refreshCredits,
      applyCreditToCart,
      retainFocus,
    }),
    [credits, loading, refreshCredits, applyCreditToCart, retainFocus]
  );

  return (
    <WarrantyCreditContext.Provider value={value}>{children}</WarrantyCreditContext.Provider>
  );
}

/** Hook for warranty credit list and cart apply helper. */
export function useWarrantyCreditContext(): WarrantyCreditContextValue {
  const ctx = useContext(WarrantyCreditContext);
  if (ctx === undefined) {
    throw new Error("useWarrantyCreditContext must be used within WarrantyCreditProvider");
  }
  return ctx;
}

/** P2: warranty credits fetch while this screen is focused. */
export function useWarrantyCreditP2Focus(name: string = "warranty_credits"): void {
  const { retainFocus } = useWarrantyCreditContext();
  useP2FocusRetain(name, retainFocus);
}
