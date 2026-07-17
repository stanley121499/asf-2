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

import { useAuthContext } from "./AuthContext";

export type WarrantyCreditView = {
  id: string;
  amountMyr: number;
  approvedPercent: number;
  status: string;
  expiresAt: string;
  usedAt: string | null;
  claimId: string;
  claimItemId: string;
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

/**
 * Fetches and validates warranty credits for the authenticated customer.
 */
export function WarrantyCreditProvider({
  children,
}: Readonly<PropsWithChildren>): JSX.Element {
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
      const res = await fetch("/api/warranty/credits", { method: "GET" });
      if (!res.ok) {
        setCredits([]);
        return;
      }
      const data = (await res.json()) as { credits: WarrantyCreditView[] };
      setCredits(data.credits);
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
      const res = await fetch("/api/warranty/credits/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditId, cartSubtotalMyr }),
      });
      const data = (await res.json()) as {
        valid: boolean;
        discountAmountMyr?: number;
        reason?: string;
      };
      if (data.valid === true && typeof data.discountAmountMyr === "number") {
        return { valid: true, discountAmountMyr: data.discountAmountMyr };
      }
      return { valid: false, reason: data.reason ?? "Could not apply warranty credit" };
    },
    []
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

/**
 * Hook for warranty credit list and cart apply helper.
 */
export function useWarrantyCreditContext(): WarrantyCreditContextValue {
  const ctx = useContext(WarrantyCreditContext);
  if (ctx === undefined) {
    throw new Error("useWarrantyCreditContext must be used within WarrantyCreditProvider");
  }
  return ctx;
}
