import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { Tables, TablesInsert, TablesUpdate } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type TicketRow = Tables<"tickets">;
type TicketInsert = TablesInsert<"tickets">;
type TicketUpdate = TablesUpdate<"tickets">;

export type Ticket = TicketRow;

type TicketAPI = {
  tickets: Ticket[];
  loading: boolean;
  createTicket: (payload: TicketInsert) => Promise<Ticket | undefined>;
  updateTicket: (id: string, payload: TicketUpdate) => Promise<Ticket | undefined>;
  deleteTicket: (id: string) => Promise<void>;
};

const TicketContext = createContext<TicketAPI | null>(null);

export const TicketProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);
    const fetchAll = async () => {
      const { data, error } = await supabase.from("tickets").select("*");
      if (error) {
        showAlert(error.message, "error");
        setLoading(false);
        return;
      }
      setTickets((data ?? []) as TicketRow[]);
      setLoading(false);
    };
    fetchAll();

    const onChange = (payload: RealtimePostgresChangesPayload<TicketRow>) => {
      if (payload.eventType === "INSERT") {
        setTickets((prev) => [...prev, payload.new as TicketRow]);
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new as TicketRow;
        setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      }
      if (payload.eventType === "DELETE") {
        const removed = payload.old as TicketRow;
        setTickets((prev) => prev.filter((t) => t.id !== removed.id));
      }
    };

    const sub = supabase
      .channel("tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, (p: RealtimePostgresChangesPayload<TicketRow>) => onChange(p))
      .subscribe();
    return () => {
      sub.unsubscribe();
    };
  }, [showAlert]);

  const api = useMemo<TicketAPI>(() => {
    return {
      tickets,
      loading,
      async createTicket(payload: TicketInsert) {
        const { data, error } = await supabase.from("tickets").insert(payload).select("*").single();
        if (error) {
          showAlert(error.message, "error");
          return undefined;
        }
        return data as TicketRow;
      },
      async updateTicket(id: string, payload: TicketUpdate) {
        const { data, error } = await supabase.from("tickets").update(payload).eq("id", id).select("*").single();
        if (error) {
          showAlert(error.message, "error");
          return undefined;
        }
        return data as TicketRow;
      },
      async deleteTicket(id: string) {
        const { error } = await supabase.from("tickets").delete().eq("id", id);
        if (error) {
          showAlert(error.message, "error");
        }
      },
    };
  }, [tickets, loading, showAlert]);

  return <TicketContext.Provider value={api}>{children}</TicketContext.Provider>;
};

export function useTicketContext(): TicketAPI {
  const ctx = useContext(TicketContext);
  if (ctx === null) {
    throw new Error("useTicketContext must be used within a TicketProvider");
  }
  return ctx;
}


