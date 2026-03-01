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
import { supabase } from "../utils/supabaseClient";
import { Tables, TablesInsert, TablesUpdate } from "../../database.types";
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
  chat_messages?: ChatMessageRow[] | null;
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

  const showAlertRef = useRef<typeof showAlert | null>(null);
  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  /**
   * Fetch all conversations with participants (messages are lazy loaded).
   */
  const fetchConversations = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, conversation_participants(*)");

      if (error) {
        showAlertRef.current?.(error.message, "error");
        return;
      }

      const rows = (data as ConversationJoinedRow[] | null) ?? [];
      const mapped: Conversation[] = rows.map((row) => {
        return {
          id: row.id,
          created_at: row.created_at,
          active: row.active ?? null,
          group_id: row.group_id ?? null,
          ticket_id: row.ticket_id ?? null,
          type: row.type ?? null,
          messages: [],
          participants: Array.isArray(row.conversation_participants)
            ? row.conversation_participants
            : [],
        };
      });

      setConversations(mapped);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Realtime: conversations
   */
  const handleConversationChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<ConversationRow>) => {
      if (payload.eventType === "INSERT") {
        const inserted = payload.new;
        setConversations((prev) => [
          ...prev,
          { ...inserted, messages: [], participants: [] },
        ]);
      }

      if (payload.eventType === "UPDATE") {
        const updated = payload.new;
        setConversations((prev) =>
          prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
        );
      }

      if (payload.eventType === "DELETE") {
        const removed = payload.old;
        setConversations((prev) => prev.filter((c) => c.id !== removed.id));
      }
    },
    []
  );

  /**
   * Realtime: chat_messages
   */
  const handleMessageChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<ChatMessageRow>) => {
      if (payload.eventType === "INSERT") {
        const inserted = payload.new;
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== inserted.conversation_id) return c;
            // Deduplicate by id to avoid optimistic + realtime double insert
            const alreadyExists = c.messages.some((m) => m.id === inserted.id);
            if (alreadyExists) return c;
            return { ...c, messages: [...c.messages, inserted] };
          })
        );
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new;
        setConversations((prev) =>
          prev.map((c) =>
            c.id === updated.conversation_id
              ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === updated.id ? updated : m
                ),
              }
              : c
          )
        );
      }
      if (payload.eventType === "DELETE") {
        const removed = payload.old;
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
    },
    []
  );

  /**
   * Realtime: conversation_participants
   */
  const handleParticipantChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<ConversationParticipantRow>) => {
      if (payload.eventType === "INSERT") {
        const inserted = payload.new;
        setConversations((prev) =>
          prev.map((c) =>
            c.id === inserted.conversation_id
              ? { ...c, participants: [...c.participants, inserted] }
              : c
          )
        );
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new;
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
        const removed = payload.old;
        setConversations((prev) =>
          prev.map((c) =>
            c.id === removed.conversation_id
              ? {
                ...c,
                participants: c.participants.filter(
                  (p) => p.id !== removed.id
                ),
              }
              : c
          )
        );
      }
    },
    []
  );

  // Initial fetch + subscription setup.
  useEffect(() => {
    void fetchConversations();

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
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload: RealtimePostgresChangesPayload<ChatMessageRow>) => {
          handleMessageChanges(payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages" },
        (payload: RealtimePostgresChangesPayload<ChatMessageRow>) => {
          handleMessageChanges(payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload: RealtimePostgresChangesPayload<ChatMessageRow>) => {
          handleMessageChanges(payload);
        }
      )
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
  }, [
    fetchConversations,
    handleConversationChanges,
    handleMessageChanges,
    handleParticipantChanges,
  ]);

  // Conversation CRUD
  /**
   * Create a conversation row.
   */
  const createConversation = useCallback(async (
    payload: ConversationInsert
  ): Promise<Conversation | undefined> => {
    const { data, error } = await supabase
      .from("conversations")
      .insert(payload)
      .select("*")
      .single();
    if (error) {
      showAlertRef.current?.(error.message, "error");
      return undefined;
    }
    const row = data as ConversationRow;
    return { ...row, messages: [], participants: [] };
  }, []);

  /**
   * Update a conversation by id.
   */
  const updateConversation = useCallback(async (
    payload: ConversationUpdate
  ): Promise<Conversation | undefined> => {
    if (!isNonEmptyString(payload.id)) {
      showAlertRef.current?.("Missing conversation id for update.", "error");
      return undefined;
    }
    const { data, error } = await supabase
      .from("conversations")
      .update(payload)
      .eq("id", payload.id)
      .select("*")
      .single();
    if (error) {
      showAlertRef.current?.(error.message, "error");
      return undefined;
    }
    const row = data as ConversationRow;
    return { ...row, messages: [], participants: [] };
  }, []);

  /**
   * Delete a conversation by id.
   */
  const deleteConversation = useCallback(async (conversationId: string): Promise<void> => {
    if (!isNonEmptyString(conversationId)) {
      showAlertRef.current?.("Invalid conversation id.", "error");
      return;
    }
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId);
    if (error) {
      showAlertRef.current?.(error.message, "error");
    }
  }, []);

  // Message CRUD
  /**
   * Create chat message.
   */
  const createMessage = useCallback(async (
    payload: ChatMessageInsert
  ): Promise<ChatMessageRow | undefined> => {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert(payload)
      .select("*")
      .single();
    if (error) {
      showAlertRef.current?.(error.message, "error");
      return undefined;
    }
    const created = data as ChatMessageRow;
    // Optimistically update local state, but guard against duplicates by id
    if (created.conversation_id) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== created.conversation_id) return c;
          const exists = c.messages.some((m) => m.id === created.id);
          if (exists) return c;
          return { ...c, messages: [...c.messages, created] };
        })
      );
    }
    return created;
  }, []);

  /**
   * Update chat message by id.
   */
  const updateMessage = useCallback(async (
    id: string,
    payload: ChatMessageUpdate
  ): Promise<ChatMessageRow | undefined> => {
    if (!isNonEmptyString(id)) {
      showAlertRef.current?.("Invalid message id.", "error");
      return undefined;
    }
    const { data, error } = await supabase
      .from("chat_messages")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      showAlertRef.current?.(error.message, "error");
      return undefined;
    }
    return data as ChatMessageRow;
  }, []);

  /**
   * Delete chat message by id.
   */
  const deleteMessage = useCallback(async (messageId: string): Promise<void> => {
    if (!isNonEmptyString(messageId)) {
      showAlertRef.current?.("Invalid message id.", "error");
      return;
    }
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", messageId);
    if (error) {
      showAlertRef.current?.(error.message, "error");
    }
  }, []);

  /**
   * List messages for a given conversation, using cached state when available.
   */
  const listMessagesByConversationId = useCallback(async (
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
      showAlertRef.current?.(error.message, "error");
      return [];
    }

    const fetchedMessages = (data ?? []) as ChatMessageRow[];

    // Cache the fetched messages in context
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: fetchedMessages }
          : c
      )
    );

    return fetchedMessages;
  }, [conversations]);

  // Participant CRUD
  /**
   * Add a conversation participant.
   */
  const addParticipant = useCallback(async (
    payload: ConversationParticipantInsert
  ): Promise<ConversationParticipantRow | undefined> => {
    const { data, error } = await supabase
      .from("conversation_participants")
      .insert(payload)
      .select("*")
      .single();
    if (error) {
      showAlertRef.current?.(error.message, "error");
      return undefined;
    }
    return data as ConversationParticipantRow;
  }, []);

  /**
   * Update participant by id.
   */
  const updateParticipant = useCallback(async (
    id: string,
    payload: ConversationParticipantUpdate
  ): Promise<ConversationParticipantRow | undefined> => {
    if (!isNonEmptyString(id)) {
      showAlertRef.current?.("Invalid participant id.", "error");
      return undefined;
    }
    const { data, error } = await supabase
      .from("conversation_participants")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      showAlertRef.current?.(error.message, "error");
      return undefined;
    }
    return data as ConversationParticipantRow;
  }, []);

  /**
   * Remove participant by id.
   */
  const removeParticipant = useCallback(async (participantId: string): Promise<void> => {
    if (!isNonEmptyString(participantId)) {
      showAlertRef.current?.("Invalid participant id.", "error");
      return;
    }
    const { error } = await supabase
      .from("conversation_participants")
      .delete()
      .eq("id", participantId);
    if (error) {
      showAlertRef.current?.(error.message, "error");
    }
  }, []);

  // Memoize context value so consumers only re-render when relevant data actually changes.
  const value = useMemo<ConversationContextProps>(
    () => ({
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
    }),
    [
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
    ]
  );

  return (
    <ConversationContext.Provider value={value}>
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
