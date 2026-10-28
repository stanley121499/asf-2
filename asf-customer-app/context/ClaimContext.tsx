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
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { useAlertContext } from "@/context/AlertContext";
import { useAuthContext } from "@/context/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/database.types";
import { logPrioP2Fetch, logPrioP2Skip } from "@/lib/prioLog";
import { useP2FocusRetain } from "@/lib/useP2FocusRetain";
import { supabase } from "@/lib/supabase";

/**
 * Skip claims network refetch on re-focus when the last successful fetch for
 * this user is newer than this window.
 */
const CLAIMS_P2_FRESH_MS = 5 * 60 * 1000;

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
  /** P2: retain fetch + realtime while a claims screen is focused. */
  retainFocus: () => () => void;
}

const ClaimContext = createContext<ClaimAPI | null>(null);

/**
 * Provides claim list state and create operations.
 * Fetch + realtime run only while a screen holds {@link ClaimAPI.retainFocus} (P2).
 */
export function ClaimProvider({ children }: PropsWithChildren): React.ReactElement {
  const { user } = useAuthContext();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [retainCount, setRetainCount] = useState(0);
  /** Epoch ms of last completed claims fetch (0 = never). */
  const lastFetchedAtRef = useRef(0);
  /** User id the last fetch belonged to (null = none). */
  const lastFetchedUserIdRef = useRef<string | null>(null);
  /** True after at least one fetch attempt finished for the current user. */
  const hasFetchedRef = useRef(false);
  const { showAlert } = useAlertContext();

  const fetchForUser = useCallback(
    async (userId: string): Promise<void> => {
      setLoading(true);
      logPrioP2Fetch("claims", "blocking");
      try {
        const { data, error } = await supabase
          .from("claims")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error !== null) {
          showAlert(error.message, "error");
          lastFetchedAtRef.current = Date.now();
          lastFetchedUserIdRef.current = userId;
          hasFetchedRef.current = true;
          return;
        }
        setClaims(data ?? []);
        lastFetchedAtRef.current = Date.now();
        lastFetchedUserIdRef.current = userId;
        hasFetchedRef.current = true;
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
      lastFetchedAtRef.current = 0;
      lastFetchedUserIdRef.current = null;
      hasFetchedRef.current = false;
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
      ageMs < CLAIMS_P2_FRESH_MS
    ) {
      logPrioP2Skip(
        "claims",
        `fresh ${String(Math.round(ageMs))}ms < ${String(CLAIMS_P2_FRESH_MS)}ms`
      );
    } else {
      void refreshClaims();
    }

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
  }, [isRetained, refreshClaims, onChange, userId]);

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
    async (userIdParam: string): Promise<Claim[]> => {
      const { data, error } = await supabase
        .from("claims")
        .select("*")
        .eq("user_id", userIdParam)
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
      retainFocus,
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
      retainFocus,
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

/** P2: claims fetch/realtime while this screen is focused. */
export function useClaimP2Focus(name: string = "claims"): void {
  const { retainFocus } = useClaimContext();
  useP2FocusRetain(name, retainFocus);
}
