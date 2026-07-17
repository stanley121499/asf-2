import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { useAuthContext } from "@/context/AuthContext";
import type { Tables } from "@/database.types";
import { roundMyr } from "@/lib/warranty/calculateCreditAmount";
import { supabase } from "@/lib/supabase";

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
 */
export function WarrantyCreditProvider({
  children,
}: Readonly<PropsWithChildren>): React.ReactElement {
  const { user } = useAuthContext();
  const [credits, setCredits] = useState<WarrantyCreditView[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshCredits = useCallback(async (): Promise<void> => {
    if (user === null) {
      setCredits([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("warranty_credits")
        .select(
          "*, claim_items(product_id, products(name))"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error !== null) {
        console.warn("WarrantyCreditProvider: fetch failed", error.message);
        setCredits([]);
        return;
      }

      const rows = (data ?? []) as CreditRowWithProduct[];
      setCredits(rows.map(mapCreditRow));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshCredits();
  }, [refreshCredits]);

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
    }),
    [credits, loading, refreshCredits, applyCreditToCart]
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
