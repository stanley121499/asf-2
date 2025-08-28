import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../../database.types";
import { useAlertContext } from "../AlertContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

/** Range row CRUD context with realtime sync. */
export type Range = Database["public"]["Tables"]["ranges"]["Row"] & { media_url?: string | null };
export type RangeInsert = Database["public"]["Tables"]["ranges"]["Insert"];
export type RangeUpdate = Database["public"]["Tables"]["ranges"]["Update"];

interface RangeContextProps {
  ranges: Range[];
  loading: boolean;
  createRange: (range: RangeInsert & { media_url?: string | null }) => Promise<Range | undefined>;
  updateRange: (range: RangeUpdate & { id: string }) => Promise<void>;
  deleteRange: (rangeId: string) => Promise<void>;
}

const RangeContext = createContext<RangeContextProps | undefined>(undefined);

export function RangeProvider({ children }: PropsWithChildren): JSX.Element {
  const [ranges, setRanges] = useState<Range[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);

    const fetchRanges = async (): Promise<void> => {
      const { data, error } = await supabase
        .from("ranges")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: true });

      if (error) {
        showAlert(error.message, "error");
        setLoading(false);
        return;
      }

      setRanges(data ?? []);
      setLoading(false);
    };

    fetchRanges();

    const handleChanges = (payload: RealtimePostgresChangesPayload<Range>): void => {
      if (payload.eventType === "INSERT") {
        setRanges((prev) => [...prev, payload.new as Range]);
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new as Range;
        if ((updated as { active?: boolean | null }).active === false) {
          setRanges((prev) => prev.filter((r) => r.id !== updated.id));
        } else {
          setRanges((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        }
      }
      if (payload.eventType === "DELETE") {
        const removed = payload.old as Range;
        setRanges((prev) => prev.filter((r) => r.id !== removed.id));
      }
    };

    const subscription = supabase
      .channel("ranges")
      .on("postgres_changes", { event: "*", schema: "public", table: "ranges" }, (payload: RealtimePostgresChangesPayload<Range>) => handleChanges(payload))
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const createRange = async (range: RangeInsert & { media_url?: string | null }): Promise<Range | undefined> => {
    const { data, error } = await supabase
      .from("ranges")
      .insert(range)
      .select()
      .single();
    if (error) {
      showAlert(error.message, "error");
      return undefined;
    }
    return data as Range;
  };

  const updateRange = async (range: RangeUpdate & { id: string }): Promise<void> => {
    const { error } = await supabase
      .from("ranges")
      .update(range)
      .eq("id", range.id)
      .single();
    if (error) {
      showAlert(error.message, "error");
    }
  };

  const deleteRange = async (rangeId: string): Promise<void> => {
    const { error } = await supabase.from("ranges").update({ active: false }).eq("id", rangeId);
    if (error) {
      showAlert(error.message, "error");
    }
  };

  return (
    <RangeContext.Provider value={{ ranges, loading, createRange, updateRange, deleteRange }}>
      {children}
    </RangeContext.Provider>
  );
}

export function useRangeContext(): RangeContextProps {
  const context = useContext(RangeContext);
  if (!context) {
    throw new Error("useRangeContext must be used within a RangeProvider");
  }
  return context;
}


