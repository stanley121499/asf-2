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
import type { Database } from "@/database.types";
import { supabase } from "@/lib/supabase";

export type StoreLocation = Database["public"]["Tables"]["store_locations"]["Row"];

export interface StoreLocationContextProps {
  storeLocations: StoreLocation[];
  loading: boolean;
  refreshStoreLocations: () => Promise<void>;
}

const StoreLocationContext = createContext<StoreLocationContextProps | undefined>(
  undefined
);

/**
 * Read-only store locations for customer discovery (RLS filters active rows).
 */
export function StoreLocationProvider({ children }: PropsWithChildren): React.ReactElement {
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshStoreLocations = useCallback(async (): Promise<void> => {
    setLoading(true);
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
        return;
      }
      setStoreLocations(data ?? []);
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

  useEffect(() => {
    void refreshStoreLocations();

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
  }, [handleRealtimeChanges, refreshStoreLocations]);

  const value = useMemo<StoreLocationContextProps>(
    () => ({
      storeLocations,
      loading,
      refreshStoreLocations,
    }),
    [storeLocations, loading, refreshStoreLocations]
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
