import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "../AlertContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { restoreById, softDeleteById } from "../../utils/softDelete";
import { isSoftDeletedRow } from "../../utils/softDeleteRuntime";

/** Range row CRUD context with realtime sync. */
type RangeRow = Database["public"]["Tables"]["ranges"]["Row"];
export type Range = RangeRow & { media_url?: string | null };
export type RangeInsert = Database["public"]["Tables"]["ranges"]["Insert"];
export type RangeUpdate = Database["public"]["Tables"]["ranges"]["Update"];

interface RangeContextProps {
  ranges: Range[];
  loading: boolean;
  createRange: (range: RangeInsert & { media_url?: string | null }) => Promise<Range | undefined>;
  updateRange: (range: RangeUpdate & { id: string }) => Promise<void>;
  deleteRange: (rangeId: string) => Promise<void>;
  restoreRange: (rangeId: string) => Promise<void>;
}

const RangeContext = createContext<RangeContextProps | undefined>(undefined);

export function RangeProvider({ children }: PropsWithChildren): JSX.Element {
  const [ranges, setRanges] = useState<Range[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();

  /**
   * A ref wrapper for AlertContext's `showAlert` to avoid effect dependency loops.
   */
  const showAlertRef = useRef<typeof showAlert | null>(null);

  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  /**
   * Fetch all active ranges from Supabase.
   */
  const fetchRanges = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ranges")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: true });

      if (error) {
        showAlertRef.current?.(error.message, "error");
        return;
      }

      setRanges((data ?? []).filter((r) => !isSoftDeletedRow(r)));
    } catch (error: unknown) {
      console.error("Failed to fetch ranges:", error);
      showAlertRef.current?.("Failed to fetch ranges", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Realtime handler for range changes.
   */
  const handleRealtimeChanges = useCallback((payload: RealtimePostgresChangesPayload<RangeRow>): void => {
    if (payload.eventType === "INSERT") {
      setRanges((prev) => [...prev, payload.new]);
    }
    if (payload.eventType === "UPDATE") {
      const updated = payload.new;
      if (isSoftDeletedRow(updated) || updated.active === false) {
        setRanges((prev) => prev.filter((r) => r.id !== updated.id));
      } else {
        setRanges((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      }
    }
    if (payload.eventType === "DELETE") {
      const removed = payload.old;
      setRanges((prev) => prev.filter((r) => r.id !== removed.id));
    }
  }, []);

  /**
   * Initial fetch + realtime subscription.
   */
  useEffect(() => {
    void fetchRanges();

    const subscription = supabase
      .channel("ranges")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ranges" },
        (payload: RealtimePostgresChangesPayload<RangeRow>) => {
          handleRealtimeChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchRanges, handleRealtimeChanges]);

  /**
   * Create a new range.
   */
  const createRange = useCallback(
    async (range: RangeInsert & { media_url?: string | null }): Promise<Range | undefined> => {
      const { data, error } = await supabase.from("ranges").insert(range).select("*").single();
      if (error) {
        showAlertRef.current?.(error.message, "error");
        return undefined;
      }
      return data ?? undefined;
    },
    []
  );

  /**
   * Update an existing range by id.
   */
  const updateRange = useCallback(async (range: RangeUpdate & { id: string }): Promise<void> => {
    const id = range.id;
    if (id.trim().length === 0) {
      showAlertRef.current?.("Range id is required to update.", "error");
      return;
    }

    const { error } = await supabase.from("ranges").update(range).eq("id", id).single();
    if (error) {
      showAlertRef.current?.(error.message, "error");
    }
  }, []);

  /**
   * Soft delete a range by setting active=false.
   */
  const deleteRange = useCallback(async (rangeId: string): Promise<void> => {
    if (rangeId.trim().length === 0) {
      showAlertRef.current?.("Range id is required to delete.", "error");
      return;
    }

    try {
      await softDeleteById("ranges", rangeId, { setActive: true });
      showAlertRef.current?.("Range deleted successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to delete range:", error);
      showAlertRef.current?.("Failed to delete range", "error");
    }
  }, []);

  /** Restore a soft-deleted range by id. */
  const restoreRange = useCallback(async (rangeId: string): Promise<void> => {
    if (rangeId.trim().length === 0) {
      showAlertRef.current?.("Range id is required to restore.", "error");
      return;
    }

    try {
      await restoreById("ranges", rangeId, { setActive: true });
      showAlertRef.current?.("Range restored successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to restore range:", error);
      showAlertRef.current?.("Failed to restore range", "error");
    }
  }, []);

  const value = useMemo<RangeContextProps>(
    () => ({
      ranges,
      loading,
      createRange,
      updateRange,
      deleteRange,
      restoreRange,
    }),
    [ranges, loading, createRange, updateRange, deleteRange, restoreRange]
  );

  return <RangeContext.Provider value={value}>{children}</RangeContext.Provider>;
}

export function useRangeContext(): RangeContextProps {
  const context = useContext(RangeContext);
  if (!context) {
    throw new Error("useRangeContext must be used within a RangeProvider");
  }
  return context;
}


