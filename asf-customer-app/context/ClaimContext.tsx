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

import { useAlertContext } from "@/context/AlertContext";
import { useAuthContext } from "@/context/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/database.types";
import { supabase } from "@/lib/supabase";

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

/** Public API for customer claim list and create operations. */
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
  listByUserId: (userId: string) => Promise<Claim[]>;
  refreshClaims: () => Promise<void>;
}

const ClaimContext = createContext<ClaimAPI | null>(null);

/**
 * Provides claim list state, create operations, and realtime sync for the signed-in customer.
 */
export function ClaimProvider({ children }: PropsWithChildren): React.ReactElement {
  const { user } = useAuthContext();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();

  const fetchForUser = useCallback(
    async (userId: string): Promise<void> => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("claims")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error !== null) {
          showAlert(error.message, "error");
          return;
        }
        setClaims(data ?? []);
      } finally {
        setLoading(false);
      }
    },
    [showAlert]
  );

  const refreshClaims = useCallback(async (): Promise<void> => {
    if (user === null) {
      setClaims([]);
      setLoading(false);
      return;
    }
    await fetchForUser(user.id);
  }, [fetchForUser, user]);

  const onChange = useCallback(
    (payload: RealtimePostgresChangesPayload<ClaimRow>): void => {
      if (user === null) {
        return;
      }
      if (payload.eventType === "INSERT") {
        const row = payload.new;
        if (row.user_id === user.id) {
          setClaims((prev) => [row, ...prev.filter((c) => c.id !== row.id)]);
        }
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new;
        if (updated.user_id === user.id) {
          setClaims((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        } else {
          setClaims((prev) => prev.filter((c) => c.id !== updated.id));
        }
      }
      if (payload.eventType === "DELETE") {
        const removed = payload.old;
        setClaims((prev) => prev.filter((c) => c.id !== removed.id));
      }
    },
    [user]
  );

  useEffect(() => {
    void refreshClaims();

    const sub = supabase
      .channel("customer_claims")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "claims" },
        (p: RealtimePostgresChangesPayload<ClaimRow>) => onChange(p)
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [refreshClaims, onChange]);

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
      listByUserId,
      refreshClaims,
    }),
    [
      claims,
      loading,
      createClaim,
      createClaimWithItems,
      fetchClaimItems,
      updateClaim,
      listByUserId,
      refreshClaims,
    ]
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
