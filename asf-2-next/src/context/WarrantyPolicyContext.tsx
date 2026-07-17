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
import { resolveWarrantyTier } from "@/modules/warranty/resolveWarrantyTier";

export type WarrantyPolicy = Database["public"]["Tables"]["warranty_policies"]["Row"];
export type WarrantyTier = Database["public"]["Tables"]["warranty_discount_tiers"]["Row"];

export type EditableWarrantyTier = {
  id?: string;
  days_from: number;
  days_to: number;
  discount_percent: number;
  sort_order: number;
};

export type WarrantyPolicyPatch = {
  name?: string;
  max_warranty_days?: number;
  credit_expiry_days?: number;
  module_label?: string | null;
  active?: boolean;
  tiers?: EditableWarrantyTier[];
};

type WarrantyPolicyContextValue = {
  policy: WarrantyPolicy | null;
  tiers: WarrantyTier[];
  loading: boolean;
  refreshPolicy: () => Promise<void>;
  updatePolicy: (patch: WarrantyPolicyPatch) => Promise<boolean>;
  previewPercentForDay: (day: number) => number;
};

const WarrantyPolicyContext = createContext<WarrantyPolicyContextValue | undefined>(
  undefined
);

/**
 * Loads and updates warranty policy + tiers via API routes.
 */
export function WarrantyPolicyProvider({
  children,
}: Readonly<PropsWithChildren>): JSX.Element {
  const [policy, setPolicy] = useState<WarrantyPolicy | null>(null);
  const [tiers, setTiers] = useState<WarrantyTier[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshPolicy = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch("/api/warranty/policies", { method: "GET" });
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as { policy: WarrantyPolicy; tiers: WarrantyTier[] };
      setPolicy(data.policy);
      setTiers(data.tiers);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPolicy();
  }, [refreshPolicy]);

  const updatePolicy = useCallback(
    async (patch: WarrantyPolicyPatch): Promise<boolean> => {
      if (policy === null) {
        return false;
      }
      const res = await fetch(`/api/warranty/policies/${policy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        return false;
      }
      const data = (await res.json()) as { policy: WarrantyPolicy; tiers: WarrantyTier[] };
      setPolicy(data.policy);
      setTiers(data.tiers);
      return true;
    },
    [policy]
  );

  const previewPercentForDay = useCallback(
    (day: number): number => {
      if (policy === null) {
        return 0;
      }
      return resolveWarrantyTier(day, tiers, policy.max_warranty_days).discountPercent;
    },
    [policy, tiers]
  );

  const value = useMemo(
    (): WarrantyPolicyContextValue => ({
      policy,
      tiers,
      loading,
      refreshPolicy,
      updatePolicy,
      previewPercentForDay,
    }),
    [policy, tiers, loading, refreshPolicy, updatePolicy, previewPercentForDay]
  );

  return (
    <WarrantyPolicyContext.Provider value={value}>{children}</WarrantyPolicyContext.Provider>
  );
}

/**
 * Hook for warranty policy settings UI.
 */
export function useWarrantyPolicyContext(): WarrantyPolicyContextValue {
  const ctx = useContext(WarrantyPolicyContext);
  if (ctx === undefined) {
    throw new Error("useWarrantyPolicyContext must be used within WarrantyPolicyProvider");
  }
  return ctx;
}
