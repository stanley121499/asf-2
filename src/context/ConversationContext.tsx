import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../utils/supabaseClient";
import { Database, Tables, TablesInsert, TablesUpdate } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

/**
 * ConversationContext manages conversations, chat messages, and participants.
 * Strongly typed against Supabase generated types and includes realtime syncing.
 */

export type ConversationRow = Tables<"conversations">;
export type ConversationInsert = TablesInsert<"conversations">;
export type ConversationUpdate = TablesUpdate<"conversations">;

export type ChatMessageRow = Tables<"chat_messages">;
export type ChatMessageInsert = TablesInsert<"chat_messages">;
export type ChatMessageUpdate = TablesUpdate<"chat_messages">;

export type ConversationParticipantRow = Tables<"conversation_participants">;
export type ConversationParticipantInsert = TablesInsert<"conversation_participants">;
export type ConversationParticipantUpdate = TablesUpdate<"conversation_participants">;

export type Conversation = ConversationRow & {
  messages: ChatMessageRow[];
  participants: ConversationParticipantRow[];
};

type ConversationJoinedRow = ConversationRow & {
  chat_messages: ChatMessageRow[] | null;
  conversation_participants: ConversationParticipantRow[] | null;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

interface ConversationContextProps {
  conversations: Conversation[];
  loading: boolean;

  // Conversation CRUD
  createConversation: (payload: ConversationInsert) => Promise<Conversation | undefined>;
  updateConversation: (payload: ConversationUpdate) => Promise<Conversation | undefined>;
  deleteConversation: (conversationId: string) => Promise<void>;

  // Message CRUD
  createMessage: (payload: ChatMessageInsert) => Promise<ChatMessageRow | undefined>;
  updateMessage: (id: string, payload: ChatMessageUpdate) => Promise<ChatMessageRow | undefined>;
  deleteMessage: (messageId: string) => Promise<void>;

  // Message listing
  listMessagesByConversationId: (conversationId: string) => Promise<ChatMessageRow[]>;

  // Participant CRUD
  addParticipant: (payload: ConversationParticipantInsert) => Promise<ConversationParticipantRow | undefined>;
  updateParticipant: (id: string, payload: ConversationParticipantUpdate) => Promise<ConversationParticipantRow | undefined>;
  removeParticipant: (participantId: string) => Promise<void>;
}

const ConversationContext = createContext<ConversationContextProps | null>(null);

export function ConversationProvider({ children }: PropsWithChildren) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);

    /**
     * Fetch all conversations with messages and participants. Maps to internal shape.
     */
    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, chat_messages(*), conversation_participants(*)");

      if (error) {
        showAlert(error.message, "error");
        setLoading(false);
        return;
      }

      const mapped: Conversation[] = (data as ConversationJoinedRow[] | null)?.map((row) => {
        const msgs = Array.isArray(row.chat_messages) ? row.chat_messages : [];
        const sorted = [...msgs].sort((a, b) => {
          const at = a.created_at ? Date.parse(a.created_at) : 0;
          const bt = b.created_at ? Date.parse(b.created_at) : 0;
          return at - bt;
        });
        return {
          id: row.id,
          created_at: row.created_at,
          active: row.active ?? null,
          group_id: row.group_id ?? null,
          ticket_id: row.ticket_id ?? null,
          type: row.type ?? null,
          messages: sorted,
          participants: Array.isArray(row.conversation_participants)
            ? row.conversation_participants
            : [],
        };
      }) ?? [];

      console.log("[ConversationContext] fetched conversations", { count: mapped.length, sample: mapped.slice(0, 2).map(c => ({ id: c.id, messages: c.messages.length, participants: c.participants.length })) });
      setConversations(mapped);
      setLoading(false);
    };

    fetchConversations();

    /**
     * Realtime: conversations
     */
    const handleConversationChanges = (
      payload: RealtimePostgresChangesPayload<ConversationRow>
    ) => {
      if (payload.eventType === "INSERT") {
        const inserted = payload.new as ConversationRow;
        setConversations((prev) => [
          ...prev,
          { ...inserted, messages: [], participants: [] },
        ]);
      }

      if (payload.eventType === "UPDATE") {
        const updated = payload.new as ConversationRow;
        setConversations((prev) =>
          prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
        );
      }

      if (payload.eventType === "DELETE") {
        const removed = payload.old as ConversationRow;
        setConversations((prev) => prev.filter((c) => c.id !== removed.id));
      }
    };

    /**
     * Realtime: chat_messages
     */
    const handleMessageChanges = (
      payload: RealtimePostgresChangesPayload<ChatMessageRow>
    ) => {
      if (payload.eventType === "INSERT") {
        const inserted = payload.new as ChatMessageRow;
        console.log("[ConversationContext] realtime message INSERT", inserted);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === inserted.conversation_id
              ? { ...c, messages: [...c.messages, inserted] }
              : c
          )
        );
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new as ChatMessageRow;
        console.log("[ConversationContext] realtime message UPDATE", updated);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === updated.conversation_id
              ? {
                  ...c,
                  messages: c.messages.map((m) => (m.id === updated.id ? updated : m)),
                }
              : c
          )
        );
      }
      if (payload.eventType === "DELETE") {
        const removed = payload.old as ChatMessageRow;
        console.log("[ConversationContext] realtime message DELETE", removed);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === removed.conversation_id
              ? {
                  ...c,
                  messages: c.messages.filter((m) => m.id !== removed.id),
                }
              : c
          )
        );
      }
    };

    /**
     * Realtime: conversation_participants
     */
    const handleParticipantChanges = (
      payload: RealtimePostgresChangesPayload<ConversationParticipantRow>
    ) => {
      if (payload.eventType === "INSERT") {
        const inserted = payload.new as ConversationParticipantRow;
        setConversations((prev) =>
          prev.map((c) =>
            c.id === inserted.conversation_id
              ? { ...c, participants: [...c.participants, inserted] }
              : c
          )
        );
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new as ConversationParticipantRow;
        setConversations((prev) =>
          prev.map((c) =>
            c.id === updated.conversation_id
              ? {
                  ...c,
                  participants: c.participants.map((p) =>
                    p.id === updated.id ? updated : p
                  ),
                }
              : c
          )
        );
      }
      if (payload.eventType === "DELETE") {
        const removed = payload.old as ConversationParticipantRow;
        setConversations((prev) =>
          prev.map((c) =>
            c.id === removed.conversation_id
              ? {
                  ...c,
                  participants: c.participants.filter((p) => p.id !== removed.id),
                }
              : c
          )
        );
      }
    };

    const conversationSubscription = supabase
      .channel("conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        (payload: RealtimePostgresChangesPayload<ConversationRow>) => {
          handleConversationChanges(payload);
        }
      )
      .subscribe();

    const messageSubscription = supabase
      .channel("chat_messages-room")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload: RealtimePostgresChangesPayload<ChatMessageRow>) => {
        handleMessageChanges(payload);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages" }, (payload: RealtimePostgresChangesPayload<ChatMessageRow>) => {
        handleMessageChanges(payload);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (payload: RealtimePostgresChangesPayload<ChatMessageRow>) => {
        handleMessageChanges(payload);
      })
      .subscribe();

    const participantSubscription = supabase
      .channel("conversation_participants")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_participants" },
        (payload: RealtimePostgresChangesPayload<ConversationParticipantRow>) => {
          handleParticipantChanges(payload);
        }
      )
      .subscribe();

    return () => {
      conversationSubscription.unsubscribe();
      messageSubscription.unsubscribe();
      participantSubscription.unsubscribe();
    };
  }, [showAlert]);

  // Conversation CRUD
  /**
   * Create a conversation row.
   */
  const createConversation = async (
    payload: ConversationInsert
  ): Promise<Conversation | undefined> => {
    const { data, error } = await supabase
      .from("conversations")
      .insert(payload)
      .select("*")
      .single();
    if (error) {
      showAlert(error.message, "error");
      return undefined;
    }
    const row = data as ConversationRow;
    return { ...row, messages: [], participants: [] };
  };

  /**
   * Update a conversation by id.
   */
  const updateConversation = async (
    payload: ConversationUpdate
  ): Promise<Conversation | undefined> => {
    if (!isNonEmptyString(payload.id)) {
      showAlert("Missing conversation id for update.", "error");
      return undefined;
    }
    const { data, error } = await supabase
      .from("conversations")
      .update(payload)
      .eq("id", payload.id)
      .select("*")
      .single();
    if (error) {
      showAlert(error.message, "error");
      return undefined;
    }
    const row = data as ConversationRow;
    return { ...row, messages: [], participants: [] };
  };

  /**
   * Delete a conversation by id.
   */
  const deleteConversation = async (conversationId: string): Promise<void> => {
    if (!isNonEmptyString(conversationId)) {
      showAlert("Invalid conversation id.", "error");
      return;
    }
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId);
    if (error) {
      showAlert(error.message, "error");
    }
  };

  // Message CRUD
  /**
   * Create chat message.
   */
  const createMessage = async (
    payload: ChatMessageInsert
  ): Promise<ChatMessageRow | undefined> => {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert(payload)
      .select("*")
      .single();
    if (error) {
      showAlert(error.message, "error");
      return undefined;
    }
    const created = data as ChatMessageRow;
    // Optimistically update local state to reflect immediately
    if (created.conversation_id) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === created.conversation_id
            ? { ...c, messages: [...c.messages, created] }
            : c
        )
      );
    }
    return created;
  };

  /**
   * Update chat message by id.
   */
  const updateMessage = async (
    id: string,
    payload: ChatMessageUpdate
  ): Promise<ChatMessageRow | undefined> => {
    if (!isNonEmptyString(id)) {
      showAlert("Invalid message id.", "error");
      return undefined;
    }
    const { data, error } = await supabase
      .from("chat_messages")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      showAlert(error.message, "error");
      return undefined;
    }
    return data as ChatMessageRow;
  };

  /**
   * Delete chat message by id.
   */
  const deleteMessage = async (messageId: string): Promise<void> => {
    if (!isNonEmptyString(messageId)) {
      showAlert("Invalid message id.", "error");
      return;
    }
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", messageId);
    if (error) {
      showAlert(error.message, "error");
    }
  };

  const listMessagesByConversationId = async (
    conversationId: string
  ): Promise<ChatMessageRow[]> => {
    if (!isNonEmptyString(conversationId)) {
      return [];
    }
    const conv = conversations.find((c) => c.id === conversationId);
    if (conv && conv.messages.length > 0) {
      return conv.messages;
    }
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) {
      showAlert(error.message, "error");
      return [];
    }
    return (data ?? []) as ChatMessageRow[];
  };

  // Participant CRUD
  /**
   * Add a conversation participant.
   */
  const addParticipant = async (
    payload: ConversationParticipantInsert
  ): Promise<ConversationParticipantRow | undefined> => {
    const { data, error } = await supabase
      .from("conversation_participants")
      .insert(payload)
      .select("*")
      .single();
    if (error) {
      showAlert(error.message, "error");
      return undefined;
    }
    return data as ConversationParticipantRow;
  };

  /**
   * Update participant by id.
   */
  const updateParticipant = async (
    id: string,
    payload: ConversationParticipantUpdate
  ): Promise<ConversationParticipantRow | undefined> => {
    if (!isNonEmptyString(id)) {
      showAlert("Invalid participant id.", "error");
      return undefined;
    }
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
    return data as ConversationParticipantRow;
  };

  /**
   * Remove participant by id.
   */
  const removeParticipant = async (participantId: string): Promise<void> => {
    if (!isNonEmptyString(participantId)) {
      showAlert("Invalid participant id.", "error");
      return;
    }
    const { error } = await supabase
      .from("conversation_participants")
      .delete()
      .eq("id", participantId);
    if (error) {
      showAlert(error.message, "error");
    }
  };

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        loading,
        createConversation,
        updateConversation,
        deleteConversation,
        createMessage,
        updateMessage,
        deleteMessage,
        listMessagesByConversationId,
        addParticipant,
        updateParticipant,
        removeParticipant,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversationContext(): ConversationContextProps {
  const context = useContext(ConversationContext);
  if (context === null) {
    throw new Error("useConversationContext must be used within a ConversationProvider");
  }
  return context;
}
