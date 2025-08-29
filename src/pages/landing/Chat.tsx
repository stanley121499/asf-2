import Picker from "emoji-picker-react";
import React, { useState, useEffect } from "react";
import { IoAddOutline, IoChevronBack } from "react-icons/io5";
import { MdOutlineEmojiEmotions } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import MessageComponent from "../../components/MessageComponent";
import { ChatMessageRow, useConversationContext } from "../../context/ConversationContext";
import { useAuthContext } from "../../context/AuthContext";
import LoadingPage from "../pages/loading";
import { useTicketContext } from "../../context/TicketContext";
import { useRef } from "react";
import { uploadToMedias } from "../../utils/upload";

const ChatWindow: React.FC = () => {
  const {
    loading,
    conversations,
    createConversation,
    createMessage,
    addParticipant,
    listMessagesByConversationId,
  } = useConversationContext();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [openEmoji, setOpenEmoji] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { createTicket, tickets, loading: ticketsLoading } = useTicketContext();
  const creatingRef = useRef<boolean>(false);
  // Conversation + local message state must be declared before any early returns
  const conversation = conversations.find((c) => c.id === conversationId);
  const [messagesLocal, setMessagesLocal] = useState<ChatMessageRow[]>([]);

  // Seed local messages from context when conversation changes
  useEffect(() => {
    if (conversation) {
      setMessagesLocal(conversation.messages ?? []);
      console.log("[Chat] Seed local messages from context", { count: conversation.messages?.length ?? 0 });
    }
  }, [conversation]);

  // Poll as a fail-safe to keep messages fresh if realtime misses
  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(async () => {
      const rows = await listMessagesByConversationId(conversationId);
      setMessagesLocal(rows);
    }, 3000);
    return () => clearInterval(interval);
  }, [conversationId, listMessagesByConversationId]);

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

  useEffect(() => {
    const run = async () => {
      if (!conversationId) return;
      console.log("[Chat] conversationId changed", { conversationId });
      const rows = await listMessagesByConversationId(conversationId);
      console.log("[Chat] listMessagesByConversationId result", { count: rows.length, sample: rows.slice(0, 3) });
    };
    void run();
  }, [conversationId, listMessagesByConversationId]);

  if (!user || loading) {
    return <LoadingPage />;
  }

  const messages = messagesLocal;

  const handleSubmit = async () => {
    if (!conversationId || !user) return;
    if (!input && !file) return;

    let mediaUrl = "";
    if (file) {
      try {
        mediaUrl = await uploadToMedias(file, "chat-messages");
      } catch (e) {
        console.error("[Chat] upload failed", e);
      }
    }

    const payload = {
      content: input,
      conversation_id: conversationId,
      created_at: new Date().toISOString(),
      media_url: mediaUrl,
      user_id: user.id,
      type: file ? "media" : "text",
    } as const;
    console.log("[Chat] Sending message", payload);
    const res = await createMessage(payload);
    console.log("[Chat] Sent message result", res);

    setInput("");
    setFile(null);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  type EmojiClick = { emoji: string };
  const onEmojiClick = (emojiObject: EmojiClick) => {
    setInput((prev) => `${prev}${emojiObject.emoji}`);
  };

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

      {/* Messages Section */}
      <div className="flex-grow p-4 overflow-y-auto">
        {!conversationId ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Starting chat...
          </p>
        ) : (
          [...messages].map((message) => {
            const direction: "inbound" | "outbound" = message.user_id === user.id ? "outbound" : "inbound";
            return (
              <div key={message.id} id={message.id}>
                {generateMessage(message, direction)}
              </div>
            );
          })
        )}
      </div>

      {/* File Preview */}
      {/* {file && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700">
          <div className="text-gray-500 truncate">{file.name}</div>
          <button
            className="text-gray-500 hover:text-red-500"
            onClick={() => setFile(null)}>
            Remove
          </button>
        </div>
      )} */}

      {/* Emoji Picker */}
      {openEmoji && (
        <div className="absolute bottom-20 left-4 right-4 z-10">
          <Picker onEmojiClick={onEmojiClick} />
        </div>
      )}

      {/* Input Section */}
      <div className="bg-white dark:bg-gray-800 p-4 shadow-md flex items-center space-x-3">
        {/* Add File */}
        <label className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
          <IoAddOutline size={24} />
          <input
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        {/* Emoji Picker */}
        <button
          type="button"
          className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
          onClick={() => setOpenEmoji(!openEmoji)}>
          <MdOutlineEmojiEmotions size={24} />
        </button>

        {/* Input Field */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-grow bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Send Button */}
        <button
          type="button"
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2"
          onClick={handleSubmit}>
          <svg
            className="w-5 h-5 rotate-90"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 18 20">
            <path d="m17.914 18.594-8-18a1 1 0 0 0-1.828 0l-8 18a1 1 0 0 0 1.157 1.376L8 18.281V9a1 1 0 0 1 2 0v9.281l6.758 1.689a1 1 0 0 0 1.156-1.376Z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const generateMessage = (message: ChatMessageRow, direction: "inbound" | "outbound") => {
  const formattedDate = new Date(message.created_at || "").toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    }
  );

  return (
    <MessageComponent
      message={message.content ?? ""}
      media={message.media_url ?? undefined}
      direction={direction}
      date={formattedDate}
      status=""
      error=""
    />
  );
};

export default ChatWindow;
