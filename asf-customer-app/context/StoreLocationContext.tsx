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
import type { Database } from "@/database.types";
import { logPrioP2Fetch, logPrioP2Skip } from "@/lib/prioLog";
import { useP2FocusRetain } from "@/lib/useP2FocusRetain";
import { supabase } from "@/lib/supabase";

/**
 * Skip store-locations network refetch on re-focus when the last successful
 * fetch is newer than this window (keeps Locations / activate revisit cheap).
 */
const STORE_LOCATIONS_P2_FRESH_MS = 5 * 60 * 1000;

export type StoreLocation = Database["public"]["Tables"]["store_locations"]["Row"];

export interface StoreLocationContextProps {
  storeLocations: StoreLocation[];
  loading: boolean;
  refreshStoreLocations: () => Promise<void>;
  /** P2: retain fetch + realtime while Locations (or activate) is focused. */
  retainFocus: () => () => void;
}

const StoreLocationContext = createContext<StoreLocationContextProps | undefined>(
  undefined
);

/**
 * Read-only store locations for customer discovery (RLS filters active rows).
 * Fetch + realtime activate only while a screen holds {@link retainFocus} (P2).
 */
export function StoreLocationProvider({ children }: PropsWithChildren): React.ReactElement {
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [retainCount, setRetainCount] = useState(0);
  /** Epoch ms of last completed locations fetch (0 = never). */
  const lastFetchedAtRef = useRef(0);
  /** True after at least one fetch attempt finished (success or empty). */
  const hasFetchedRef = useRef(false);

  /**
   * Loads active store locations from Supabase.
   */
  const refreshStoreLocations = useCallback(async (): Promise<void> => {
    setLoading(true);
    logPrioP2Fetch("store_locations", "blocking");
    try {
      const { data, error } = await supabase
        .from("store_locations")
        .select("*")
        .eq("active", true)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error !== null) {
        if (process.env.NODE_ENV === "development") {
          console.error("[StoreLocationContext] fetch failed:", error.message);
        }
        setStoreLocations([]);
        lastFetchedAtRef.current = Date.now();
        hasFetchedRef.current = true;
        return;
      }
      setStoreLocations(data ?? []);
      lastFetchedAtRef.current = Date.now();
      hasFetchedRef.current = true;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRealtimeChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<StoreLocation>): void => {
      if (payload.eventType === "INSERT") {
        if (payload.new.active && payload.new.deleted_at === null) {
          setStoreLocations((prev) => [...prev, payload.new]);
        }
        return;
      }
      if (payload.eventType === "UPDATE") {
        setStoreLocations((prev) => {
          const visible = payload.new.active && payload.new.deleted_at === null;
          const without = prev.filter((row) => row.id !== payload.new.id);
          return visible ? [...without, payload.new] : without;
        });
        return;
      }
      if (payload.eventType === "DELETE") {
        setStoreLocations((prev) => prev.filter((row) => row.id !== payload.old.id));
      }
    },
    []
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

  useEffect(() => {
    if (!isRetained) {
      return;
    }

    const now = Date.now();
    const ageMs = now - lastFetchedAtRef.current;
    if (
      hasFetchedRef.current &&
      ageMs >= 0 &&
      ageMs < STORE_LOCATIONS_P2_FRESH_MS
    ) {
      logPrioP2Skip(
        "store_locations",
        `fresh ${String(Math.round(ageMs))}ms < ${String(STORE_LOCATIONS_P2_FRESH_MS)}ms`
      );
    } else {
      void refreshStoreLocations();
    }

    const channel = supabase
      .channel("store_locations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "store_locations" },
        handleRealtimeChanges
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [handleRealtimeChanges, refreshStoreLocations, isRetained]);

  const value = useMemo<StoreLocationContextProps>(
    () => ({
      storeLocations,
      loading,
      refreshStoreLocations,
      retainFocus,
    }),
    [storeLocations, loading, refreshStoreLocations, retainFocus]
  );

  return (
    <StoreLocationContext.Provider value={value}>{children}</StoreLocationContext.Provider>
  );
}

/**
 * Access read-only store location state.
 */
export function useStoreLocationContext(): StoreLocationContextProps {
  const ctx = useContext(StoreLocationContext);
  if (ctx === undefined) {
    throw new Error("useStoreLocationContext must be used within StoreLocationProvider");
  }
  return ctx;
}

/**
 * Same as {@link useStoreLocationContext}, but returns null when the provider is
 * gated off (store_locations / warranty_registration flags) so callers like
 * store-welcome can resolve imagery without crashing.
 */
export function useOptionalStoreLocationContext(): StoreLocationContextProps | null {
  const ctx = useContext(StoreLocationContext);
  return ctx ?? null;
}

/** P2: store locations fetch/realtime while this screen is focused. */
export function useStoreLocationP2Focus(name: string = "store_locations"): void {
  const { retainFocus } = useStoreLocationContext();
  useP2FocusRetain(name, retainFocus);
}
