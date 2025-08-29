import React, { useState, useEffect } from "react";
import { IoChevronBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { Conversation, useConversationContext } from "../../context/ConversationContext";
import { useAuthContext } from "../../context/AuthContext";
import LoadingPage from "../pages/loading";
import { useTicketContext } from "../../context/TicketContext";
import { useRef } from "react";
import ChatWindow from "../support/chat-window";

const LandingSupportChat: React.FC = () => {
  const {
    loading,
    conversations,
    createConversation,
    addParticipant,
    listMessagesByConversationId,
  } = useConversationContext();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { createTicket, tickets, loading: ticketsLoading } = useTicketContext();
  const creatingRef = useRef<boolean>(false);
  // Conversation + local message state must be declared before any early returns
  const conversation = conversations.find((c) => c.id === conversationId);

  // Poll as a fail-safe to keep messages fresh if realtime misses
  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(async () => {
      await listMessagesByConversationId(conversationId);
    }, 3000);
    return () => clearInterval(interval);
  }, [conversationId, listMessagesByConversationId]);

  // Always pick the freshest conversation reference to ensure instant UI updates
  useEffect(() => {
    if (!conversationId) {
      setActiveConversation(null);
      return;
    }
    const latest = conversations.find((c) => c.id === conversationId) ?? null;
    setActiveConversation(latest);
  }, [conversationId, conversations]);

  useEffect(() => {
    if (!user || loading || ticketsLoading) {
      console.log("[Chat] Waiting for data", { hasUser: !!user, loading, ticketsLoading });
      return;
    }
    if (creatingRef.current) return;

    // Prefer existing open ticket for this user
    const openTicket = tickets.find((t) => t.user_id === user.id && t.status !== "closed");
    console.log("[Chat] Open ticket lookup", { openTicket, ticketsCount: tickets.length });

    // Find conversation strictly by the open ticket id first
    const convByOpenTicket = openTicket
      ? conversations.find((c) => c.type === "support" && c.ticket_id === openTicket.id)
      : undefined;

    // Otherwise, find a participant conversation that is not tied to a closed ticket
    const participantSupportConvs = conversations.filter(
      (c) => c.type === "support" && c.participants.some((p) => p.user_id === user.id)
    );
    const participantOpenConv = participantSupportConvs.find((c) => {
      if (!c.ticket_id) return true;
      const t = tickets.find((tk) => tk.id === c.ticket_id);
      return t ? t.status !== "closed" : true;
    });

    const existing = convByOpenTicket ?? participantOpenConv;
    if (existing) {
      console.log("[Chat] Using existing support conversation", { conversationId: existing.id, ticketId: existing.ticket_id, messages: existing.messages?.length ?? 0 });
      setConversationId(existing.id);
      return;
    }

    const init = async () => {
      creatingRef.current = true;
      try {
        const ticket = openTicket ?? (await createTicket({ user_id: user.id, status: "open" }));
        const created = await createConversation({ type: "support", active: true, ticket_id: ticket?.id ?? null });
        if (!created?.id) return;
        await addParticipant({ conversation_id: created.id, user_id: user.id });
        console.log("[Chat] Created support conversation", { conversationId: created.id, ticketId: ticket?.id });
        setConversationId(created.id);
      } finally {
        creatingRef.current = false;
      }
    };

    void init();
  }, [tickets, ticketsLoading, conversations, createConversation, addParticipant, loading, user, createTicket]);

  // Optional diagnostics removed for cleaner UI

  if (!user || loading) {
    return <LoadingPage />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 flex items-center p-4 shadow-md">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
          <IoChevronBack size={24} />
        </button>
        <h1 className="flex-grow text-center text-lg font-semibold text-gray-800 dark:text-white">
          Chat with Support
        </h1>
      </div>

      {/* Messages + Input handled by shared ChatWindow to match internal/support UI */}
      <div className="flex-grow min-h-0">
        {activeConversation ? (
          <ChatWindow conversation={activeConversation} messages={activeConversation.messages} />
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Starting chat...</div>
        )}
      </div>
    </div>
  );
};
export default LandingSupportChat;
