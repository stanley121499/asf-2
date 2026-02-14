import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../utils/supabaseClient";
import { Tables, TablesInsert, TablesUpdate } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type LogRow = Tables<"ticket_status_change_logs">;
type LogInsert = TablesInsert<"ticket_status_change_logs">;
type LogUpdate = TablesUpdate<"ticket_status_change_logs">;

type TicketStatusLogAPI = {
  logs: LogRow[];
  loading: boolean;
  listByTicketId: (ticketId: string) => Promise<LogRow[]>;
  createLog: (payload: LogInsert) => Promise<LogRow | undefined>;
  updateLog: (id: string, payload: LogUpdate) => Promise<LogRow | undefined>;
  deleteLog: (id: string) => Promise<void>;
};

const TicketStatusLogContext = createContext<TicketStatusLogAPI | null>(null);

export const TicketStatusLogProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();

  /**
   * Fetch all status change logs.
   */
  const fetchAll = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("ticket_status_change_logs").select("*");
      if (error) {
        showAlert(error.message, "error");
        return;
      }
      setLogs(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  /**
   * Realtime handler for status change log changes.
   */
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
      .channel("ticket_status_change_logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ticket_status_change_logs" },
        (p: RealtimePostgresChangesPayload<LogRow>) => onChange(p)
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [fetchAll, onChange]);

  /**
   * List logs by ticket id.
   */
  const listByTicketId = useCallback(async (ticketId: string): Promise<LogRow[]> => {
    const { data, error } = await supabase
      .from("ticket_status_change_logs")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (error) {
      showAlert(error.message, "error");
      return [];
    }
    return data ?? [];
  }, [showAlert]);

  /**
   * Create a log entry.
   */
  const createLog = useCallback(async (payload: LogInsert): Promise<LogRow | undefined> => {
    const { data, error } = await supabase
      .from("ticket_status_change_logs")
      .insert(payload)
      .select("*")
      .single();
    if (error) {
      showAlert(error.message, "error");
      return undefined;
    }
    return data;
  }, [showAlert]);

  /**
   * Update a log entry by id.
   */
  const updateLog = useCallback(async (id: string, payload: LogUpdate): Promise<LogRow | undefined> => {
    const { data, error } = await supabase
      .from("ticket_status_change_logs")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      showAlert(error.message, "error");
      return undefined;
    }
    return data;
  }, [showAlert]);

  /**
   * Delete a log entry by id.
   */
  const deleteLog = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("ticket_status_change_logs")
      .delete()
      .eq("id", id);
    if (error) {
      showAlert(error.message, "error");
    }
  }, [showAlert]);

  const api = useMemo<TicketStatusLogAPI>(() => {
    return {
      logs,
      loading,
      listByTicketId,
      createLog,
      updateLog,
      deleteLog,
    };
  }, [logs, loading, listByTicketId, createLog, updateLog, deleteLog]);

  return (
    <TicketStatusLogContext.Provider value={api}>
      {children}
    </TicketStatusLogContext.Provider>
  );
};

export function useTicketStatusLogContext(): TicketStatusLogAPI {
  const ctx = useContext(TicketStatusLogContext);
  if (ctx === null) {
    throw new Error("useTicketStatusLogContext must be used within a TicketStatusLogProvider");
  }
  return ctx;
}


