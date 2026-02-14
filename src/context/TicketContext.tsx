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

  /**
   * Fetch all tickets from the database.
   */
  const fetchAll = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("tickets").select("*");
      if (error) {
        showAlert(error.message, "error");
        return;
      }
      setTickets(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  /**
   * Realtime handler for ticket table changes.
   */
  const onChange = useCallback((payload: RealtimePostgresChangesPayload<TicketRow>): void => {
    if (payload.eventType === "INSERT") {
      setTickets((prev) => [...prev, payload.new]);
    }
    if (payload.eventType === "UPDATE") {
      const updated = payload.new;
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
    if (payload.eventType === "DELETE") {
      const removed = payload.old;
      setTickets((prev) => prev.filter((t) => t.id !== removed.id));
    }
  }, []);

  // Initial fetch + subscription setup.
  useEffect(() => {
    void fetchAll();

    const sub = supabase
      .channel("tickets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        (p: RealtimePostgresChangesPayload<TicketRow>) => onChange(p)
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [fetchAll, onChange]);

  /**
   * Create a new ticket.
   */
  const createTicket = useCallback(async (payload: TicketInsert): Promise<Ticket | undefined> => {
    const { data, error } = await supabase.from("tickets").insert(payload).select("*").single();
    if (error) {
      showAlert(error.message, "error");
      return undefined;
    }
    return data;
  }, [showAlert]);

  /**
   * Update a ticket and optimistically update local state.
   */
  const updateTicket = useCallback(async (id: string, payload: TicketUpdate): Promise<Ticket | undefined> => {
    const { data, error } = await supabase
      .from("tickets")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      showAlert(error.message, "error");
      return undefined;
    }

    // Optimistically update local state so UI reflects immediately without waiting for realtime
    setTickets((prev) => prev.map((t) => (t.id === data.id ? data : t)));
    return data;
  }, [showAlert]);

  /**
   * Delete a ticket by id.
   */
  const deleteTicket = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from("tickets").delete().eq("id", id);
    if (error) {
      showAlert(error.message, "error");
    }
  }, [showAlert]);

  // Memoize API to prevent unnecessary rerenders of consumers.
  const api = useMemo<TicketAPI>(() => {
    return {
      tickets,
      loading,
      createTicket,
      updateTicket,
      deleteTicket,
    };
  }, [tickets, loading, createTicket, updateTicket, deleteTicket]);

  return <TicketContext.Provider value={api}>{children}</TicketContext.Provider>;
};

export function useTicketContext(): TicketAPI {
  const ctx = useContext(TicketContext);
  if (ctx === null) {
    throw new Error("useTicketContext must be used within a TicketProvider");
  }
  return ctx;
}


