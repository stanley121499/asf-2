import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    setLoading(true);
    const fetchAll = async () => {
      const { data, error } = await supabase.from("ticket_status_change_logs").select("*");
      if (error) {
        showAlert(error.message, "error");
        setLoading(false);
        return;
      }
      setLogs((data ?? []) as LogRow[]);
      setLoading(false);
    };
    fetchAll();

    const onChange = (payload: RealtimePostgresChangesPayload<LogRow>) => {
      if (payload.eventType === "INSERT") {
        setLogs((prev) => [...prev, payload.new as LogRow]);
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new as LogRow;
        setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      }
      if (payload.eventType === "DELETE") {
        const removed = payload.old as LogRow;
        setLogs((prev) => prev.filter((l) => l.id !== removed.id));
      }
    };

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
  }, [showAlert]);

  const api = useMemo<TicketStatusLogAPI>(() => {
    return {
      logs,
      loading,
      async listByTicketId(ticketId: string) {
        const { data, error } = await supabase
          .from("ticket_status_change_logs")
          .select("*")
          .eq("ticket_id", ticketId)
          .order("created_at", { ascending: true });
        if (error) {
          showAlert(error.message, "error");
          return [];
        }
        return (data ?? []) as LogRow[];
      },
      async createLog(payload: LogInsert) {
        const { data, error } = await supabase
          .from("ticket_status_change_logs")
          .insert(payload)
          .select("*")
          .single();
        if (error) {
          showAlert(error.message, "error");
          return undefined;
        }
        return data as LogRow;
      },
      async updateLog(id: string, payload: LogUpdate) {
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
        return data as LogRow;
      },
      async deleteLog(id: string) {
        const { error } = await supabase
          .from("ticket_status_change_logs")
          .delete()
          .eq("id", id);
        if (error) {
          showAlert(error.message, "error");
        }
      },
    };
  }, [logs, loading, showAlert]);

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


