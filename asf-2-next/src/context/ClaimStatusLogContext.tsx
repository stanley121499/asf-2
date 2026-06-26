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

type LogRow = Tables<"claim_status_change_logs">;
type LogInsert = TablesInsert<"claim_status_change_logs">;
type LogUpdate = TablesUpdate<"claim_status_change_logs">;

/** Public API for claim status audit logs. */
export interface ClaimStatusLogAPI {
  logs: LogRow[];
  loading: boolean;
  listByClaimId: (claimId: string) => Promise<LogRow[]>;
  createLog: (payload: LogInsert) => Promise<LogRow | undefined>;
  updateLog: (id: string, payload: LogUpdate) => Promise<LogRow | undefined>;
  deleteLog: (id: string) => Promise<void>;
}

const ClaimStatusLogContext = createContext<ClaimStatusLogAPI | null>(null);

/**
 * Provides claim status change log state and CRUD with realtime sync.
 */
export function ClaimStatusLogProvider({
  children,
}: PropsWithChildren): React.ReactElement {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();

  const fetchAll = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("claim_status_change_logs")
        .select("*")
        .order("created_at", { ascending: true });
      if (error !== null) {
        showAlert(error.message, "error");
        return;
      }
      setLogs(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  const onChange = useCallback((payload: RealtimePostgresChangesPayload<LogRow>): void => {
    if (payload.eventType === "INSERT") {
      setLogs((prev) => [...prev, payload.new]);
    }
    if (payload.eventType === "UPDATE") {
      const updated = payload.new;
      setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    }
    if (payload.eventType === "DELETE") {
      const removed = payload.old;
      setLogs((prev) => prev.filter((l) => l.id !== removed.id));
    }
  }, []);

  useEffect(() => {
    void fetchAll();

    const sub = supabase
      .channel("claim_status_change_logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "claim_status_change_logs" },
        (p: RealtimePostgresChangesPayload<LogRow>) => onChange(p)
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [fetchAll, onChange]);

  const listByClaimId = useCallback(
    async (claimId: string): Promise<LogRow[]> => {
      const { data, error } = await supabase
        .from("claim_status_change_logs")
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

  const createLog = useCallback(
    async (payload: LogInsert): Promise<LogRow | undefined> => {
      const { data, error } = await supabase
        .from("claim_status_change_logs")
        .insert(payload)
        .select("*")
        .single();
      if (error !== null) {
        showAlert(error.message, "error");
        return undefined;
      }
      return data;
    },
    [showAlert]
  );

  const updateLog = useCallback(
    async (id: string, payload: LogUpdate): Promise<LogRow | undefined> => {
      const { data, error } = await supabase
        .from("claim_status_change_logs")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
      if (error !== null) {
        showAlert(error.message, "error");
        return undefined;
      }
      return data;
    },
    [showAlert]
  );

  const deleteLog = useCallback(
    async (id: string): Promise<void> => {
      const { error } = await supabase.from("claim_status_change_logs").delete().eq("id", id);
      if (error !== null) {
        showAlert(error.message, "error");
      }
    },
    [showAlert]
  );

  const api = useMemo<ClaimStatusLogAPI>(
    () => ({
      logs,
      loading,
      listByClaimId,
      createLog,
      updateLog,
      deleteLog,
    }),
    [logs, loading, listByClaimId, createLog, updateLog, deleteLog]
  );

  return (
    <ClaimStatusLogContext.Provider value={api}>{children}</ClaimStatusLogContext.Provider>
  );
}

/** Hook to access claim status log context. */
export function useClaimStatusLogContext(): ClaimStatusLogAPI {
  const ctx = useContext(ClaimStatusLogContext);
  if (ctx === null) {
    throw new Error("useClaimStatusLogContext must be used within a ClaimStatusLogProvider");
  }
  return ctx;
}
