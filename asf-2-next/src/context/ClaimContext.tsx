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
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabaseClient";
import type { Tables, TablesInsert, TablesUpdate } from "@/database.types";
import { useAlertContext } from "./AlertContext";

type ClaimRow = Tables<"claims">;
type ClaimInsert = TablesInsert<"claims">;
type ClaimUpdate = TablesUpdate<"claims">;
type ClaimItemRow = Tables<"claim_items">;
type ClaimItemInsert = TablesInsert<"claim_items">;

export type Claim = ClaimRow;
export type ClaimItem = ClaimItemRow;

export type CreateClaimItemInput = {
  orderItemId: string;
  productId: string | null;
  lineItemPriceMyr: number;
  daysSinceDelivery: number | null;
  recommendedPercent: number | null;
};

/** Public API for claim CRUD and realtime sync. */
export interface ClaimAPI {
  claims: Claim[];
  loading: boolean;
  createClaim: (payload: ClaimInsert) => Promise<Claim | undefined>;
  createClaimWithItems: (
    payload: ClaimInsert,
    items: CreateClaimItemInput[]
  ) => Promise<Claim | undefined>;
  fetchClaimItems: (claimId: string) => Promise<ClaimItem[]>;
  updateClaim: (id: string, payload: ClaimUpdate) => Promise<Claim | undefined>;
  deleteClaim: (id: string) => Promise<void>;
  listByUserId: (userId: string) => Promise<Claim[]>;
}

const ClaimContext = createContext<ClaimAPI | null>(null);

/**
 * Provides claim list state, CRUD operations, and realtime subscription.
 */
export function ClaimProvider({ children }: PropsWithChildren): React.ReactElement {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();

  /** Fetches all claims (staff view). */
  const fetchAll = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("claims")
        .select("*")
        .order("created_at", { ascending: false });
      if (error !== null) {
        showAlert(error.message, "error");
        return;
      }
      setClaims(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  /** Realtime handler for claim table changes. */
  const onChange = useCallback(
    (payload: RealtimePostgresChangesPayload<ClaimRow>): void => {
      if (payload.eventType === "INSERT") {
        setClaims((prev) => [payload.new, ...prev]);
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new;
        setClaims((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      }
      if (payload.eventType === "DELETE") {
        const removed = payload.old;
        setClaims((prev) => prev.filter((c) => c.id !== removed.id));
      }
    },
    []
  );

  useEffect(() => {
    void fetchAll();

    const sub = supabase
      .channel("claims")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "claims" },
        (p: RealtimePostgresChangesPayload<ClaimRow>) => onChange(p)
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [fetchAll, onChange]);

  /** Creates a new claim row. */
  const createClaim = useCallback(
    async (payload: ClaimInsert): Promise<Claim | undefined> => {
      const now = new Date().toISOString();
      const row: ClaimInsert = {
        ...payload,
        updated_at: now,
        evidence_urls: payload.evidence_urls ?? [],
      };
      const { data, error } = await supabase.from("claims").insert(row).select("*").single();
      if (error !== null) {
        showAlert(error.message, "error");
        return undefined;
      }
      return data;
    },
    [showAlert]
  );

  /** Creates a claim with multiple claim_items rows. */
  const createClaimWithItems = useCallback(
    async (payload: ClaimInsert, items: CreateClaimItemInput[]): Promise<Claim | undefined> => {
      const created = await createClaim(payload);
      if (created === undefined || items.length === 0) {
        return created;
      }

      const rows: ClaimItemInsert[] = items.map((item) => ({
        claim_id: created.id,
        order_item_id: item.orderItemId,
        product_id: item.productId,
        line_item_price_myr: item.lineItemPriceMyr,
        days_since_delivery: item.daysSinceDelivery,
        recommended_percent: item.recommendedPercent,
      }));

      const { error } = await supabase.from("claim_items").insert(rows);
      if (error !== null) {
        showAlert(error.message, "error");
        return undefined;
      }
      return created;
    },
    [createClaim, showAlert]
  );

  /** Fetches claim_items for a claim. */
  const fetchClaimItems = useCallback(
    async (claimId: string): Promise<ClaimItem[]> => {
      const { data, error } = await supabase
        .from("claim_items")
        .select("*")
        .eq("claim_id", claimId)
        .order("created_at", { ascending: true });
      if (error !== null) {
        showAlert(error.message, "error");
        return [];
      }
      return data ?? [];
    },
    [showAlert]
  );

  /** Updates a claim and optimistically syncs local state. */
  const updateClaim = useCallback(
    async (id: string, payload: ClaimUpdate): Promise<Claim | undefined> => {
      const { data, error } = await supabase
        .from("claims")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();
      if (error !== null) {
        showAlert(error.message, "error");
        return undefined;
      }
      setClaims((prev) => prev.map((c) => (c.id === data.id ? data : c)));
      return data;
    },
    [showAlert]
  );

  /** Deletes a claim by id. */
  const deleteClaim = useCallback(
    async (id: string): Promise<void> => {
      const { error } = await supabase.from("claims").delete().eq("id", id);
      if (error !== null) {
        showAlert(error.message, "error");
      }
    },
    [showAlert]
  );

  /** Lists claims for a specific customer. */
  const listByUserId = useCallback(
    async (userId: string): Promise<Claim[]> => {
      const { data, error } = await supabase
        .from("claims")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error !== null) {
        showAlert(error.message, "error");
        return [];
      }
      return data ?? [];
    },
    [showAlert]
  );

  const api = useMemo<ClaimAPI>(
    () => ({
      claims,
      loading,
      createClaim,
      createClaimWithItems,
      fetchClaimItems,
      updateClaim,
      deleteClaim,
      listByUserId,
    }),
    [claims, loading, createClaim, createClaimWithItems, fetchClaimItems, updateClaim, deleteClaim, listByUserId]
  );

  return <ClaimContext.Provider value={api}>{children}</ClaimContext.Provider>;
}

/** Hook to access claim context. */
export function useClaimContext(): ClaimAPI {
  const ctx = useContext(ClaimContext);
  if (ctx === null) {
    throw new Error("useClaimContext must be used within a ClaimProvider");
  }
  return ctx;
}
