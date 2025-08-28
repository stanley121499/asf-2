import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";

export type Conversation =
  Database["public"]["Tables"]["conversations"]["Row"] & {
    messages: Database["public"]["Tables"]["messages"]["Row"][];
  };
export type Conversations = { conversations: Conversation[] };
export type ConversationInsert =
  Database["public"]["Tables"]["conversations"]["Insert"];
export type ConversationUpdate =
  Database["public"]["Tables"]["conversations"]["Update"];

export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Messages = { messages: Message[] };
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];
export type MessageUpdate = Database["public"]["Tables"]["messages"]["Update"];

interface ConversationContextProps {
  conversations: Conversation[];
  createConversation: (
    conversation: ConversationInsert
  ) => Promise<Conversation | undefined>;
  updateConversation: (
    conversation: ConversationUpdate
  ) => Promise<Conversation | undefined>;
  deleteConversation: (conversationId: string) => Promise<void>;

  createMessage: (message: MessageInsert) => Promise<void>;
  updateMessage: (message: MessageUpdate) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;

  loading: boolean;
}

const ConversationContext = createContext<ConversationContextProps>(undefined!);

export function ConversationProvider({ children }: PropsWithChildren) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);

    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, messages(*)");

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      setConversations(data as Conversation[]);
    };

    fetchConversations();

    const handleConversationChanges = (payload: any) => {
      if (payload.eventType === "INSERT") {
        setConversations((prev) => [...prev, { ...payload.new, messages: [] }]);
      }

      if (payload.eventType === "UPDATE") {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === payload.new.id
              ? { ...conversation, ...payload.new }
              : conversation
          )
        );
      }

      if (payload.eventType === "DELETE") {
        setConversations((prev) =>
          prev.filter((conversation) => conversation.id !== payload.old.id)
        );
      }
    };

    const handleMessageChanges = (payload: any) => {
      setConversations((prev) =>
        prev.map((conversation) => {
          if (conversation.id === payload.new.conversation_id) {
            if (payload.eventType === "INSERT") {
              return {
                ...conversation,
                messages: [...conversation.messages, payload.new],
              };
            }

            if (payload.eventType === "UPDATE") {
              return {
                ...conversation,
                messages: conversation.messages.map((msg) =>
                  msg.id === payload.new.id ? payload.new : msg
                ),
              };
            }

            if (payload.eventType === "DELETE") {
              return {
                ...conversation,
                messages: conversation.messages.filter(
                  (msg) => msg.id !== payload.old.id
                ),
              };
            }
          }
          return conversation;
        })
      );
    };

    const conversationSubscription = supabase
      .channel("conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        (payload) => {
          handleConversationChanges(payload);
        }
      )
      .subscribe();

    const messageSubscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          handleMessageChanges(payload);
        }
      )
      .subscribe();

    setLoading(false);

    return () => {
      conversationSubscription.unsubscribe();
      messageSubscription.unsubscribe();
    };
  }, [showAlert]);

  // 📌 Conversation CRUD
  const createConversation = async (conversation: ConversationInsert) => {
    const { data, error } = await supabase
      .from("conversations")
      .insert(conversation);
    if (error) {
      showAlert(error.message, "error");
      console.log(error.message);
      return;
    }
    return data?.[0];
  };

  const updateConversation = async (conversation: ConversationUpdate) => {
    if (!conversation.id) {
      showAlert("Missing conversation id for update.", "error");
      return;
    }
    const { data, error } = await supabase
      .from("conversations")
      .update(conversation)
      .eq("id", conversation.id);
    if (error) {
      showAlert(error.message, "error");
      console.log(error.message);
      return;
    }
    return data?.[0];
  };

  const deleteConversation = async (conversationId: string) => {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .match({ id: conversationId });
    if (error) {
      showAlert(error.message, "error");
      console.log(error.message);
      return;
    }
  };

  // 📌 Message CRUD
  const createMessage = async (message: MessageInsert) => {
    const { error } = await supabase.from("messages").insert(message);
    if (error) {
      showAlert(error.message, "error");
      console.log(error.message);
      return;
    }
  };

  const updateMessage = async (message: MessageUpdate) => {
    if (!message.id) {
      showAlert("Missing message id for update.", "error");
      return;
    }
    const { error } = await supabase
      .from("messages")
      .update(message)
      .eq("id", message.id);
    if (error) {
      showAlert(error.message, "error");
      console.log(error.message);
      return;
    }
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("messages")
      .delete()
      .match({ id: messageId });
    if (error) {
      showAlert(error.message, "error");
      console.log(error.message);
      return;
    }
  };

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        createConversation,
        updateConversation,
        deleteConversation,
        createMessage,
        updateMessage,
        deleteMessage,
        loading,
      }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversationContext() {
  const context = useContext(ConversationContext);

  if (!context) {
    throw new Error(
      "useConversationContext must be used within a ConversationProvider"
    );
  }

  return context;
}
