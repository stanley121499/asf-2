import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { Tables, TablesInsert, TablesUpdate } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type ParticipantRow = Tables<"conversation_participants">;
type ParticipantInsert = TablesInsert<"conversation_participants">;
type ParticipantUpdate = TablesUpdate<"conversation_participants">;

type ParticipantAPI = {
  participants: ParticipantRow[];
  loading: boolean;
  listByConversation: (conversationId: string) => Promise<ParticipantRow[]>;
  addParticipant: (payload: ParticipantInsert) => Promise<ParticipantRow | undefined>;
  updateParticipant: (id: string, payload: ParticipantUpdate) => Promise<ParticipantRow | undefined>;
  removeParticipant: (id: string) => Promise<void>;
};

const ConversationParticipantContext = createContext<ParticipantAPI | null>(null);

export const ConversationParticipantProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);
    const fetchAll = async () => {
      const { data, error } = await supabase.from("conversation_participants").select("*");
      if (error) {
        showAlert(error.message, "error");
        setLoading(false);
        return;
      }
      setParticipants((data ?? []) as ParticipantRow[]);
      setLoading(false);
    };
    fetchAll();

    const onChange = (payload: RealtimePostgresChangesPayload<ParticipantRow>) => {
      if (payload.eventType === "INSERT") {
        setParticipants((prev) => [...prev, payload.new as ParticipantRow]);
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new as ParticipantRow;
        setParticipants((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
      if (payload.eventType === "DELETE") {
        const removed = payload.old as ParticipantRow;
        setParticipants((prev) => prev.filter((p) => p.id !== removed.id));
      }
    };

    const sub = supabase
      .channel("conversation_participants")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_participants" }, (p: RealtimePostgresChangesPayload<ParticipantRow>) => onChange(p))
      .subscribe();
    return () => {
      sub.unsubscribe();
    };
  }, [showAlert]);

  const api = useMemo<ParticipantAPI>(() => {
    return {
      participants,
      loading,
      async listByConversation(conversationId: string) {
        const { data, error } = await supabase
          .from("conversation_participants")
          .select("*")
          .eq("conversation_id", conversationId);
        if (error) {
          showAlert(error.message, "error");
          return [];
        }
        return (data ?? []) as ParticipantRow[];
      },
      async addParticipant(payload: ParticipantInsert) {
        const { data, error } = await supabase
          .from("conversation_participants")
          .insert(payload)
          .select("*")
          .single();
        if (error) {
          showAlert(error.message, "error");
          return undefined;
        }
        return data as ParticipantRow;
      },
      async updateParticipant(id: string, payload: ParticipantUpdate) {
        const { data, error } = await supabase
          .from("conversation_participants")
          .update(payload)
          .eq("id", id)
          .select("*")
          .single();
        if (error) {
          showAlert(error.message, "error");
          return undefined;
        }
        return data as ParticipantRow;
      },
      async removeParticipant(id: string) {
        const { error } = await supabase
          .from("conversation_participants")
          .delete()
          .eq("id", id);
        if (error) {
          showAlert(error.message, "error");
        }
      },
    };
  }, [participants, loading, showAlert]);

  return (
    <ConversationParticipantContext.Provider value={api}>
      {children}
    </ConversationParticipantContext.Provider>
  );
};

export function useConversationParticipantContext(): ParticipantAPI {
  const ctx = useContext(ConversationParticipantContext);
  if (ctx === null) {
    throw new Error(
      "useConversationParticipantContext must be used within a ConversationParticipantProvider"
    );
  }
  return ctx;
}


