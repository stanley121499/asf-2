import Picker from "emoji-picker-react";
import React, { useState, useEffect } from "react";
import { IoAddOutline, IoChevronBack } from "react-icons/io5";
import { MdOutlineEmojiEmotions } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import MessageComponent from "../../components/MessageComponent";
import {
  Message,
  useConversationContext,
} from "../../context/ConversationContext";
import { useAuthContext } from "../../context/AuthContext";
import LoadingPage from "../pages/loading";

const ChatWindow: React.FC = () => {
  const { loading, conversations, createConversation, createMessage } =
    useConversationContext();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [openEmoji, setOpenEmoji] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user || loading || conversations.length === 0) return;
    // Check if the user has an existing conversation
    let existingConversation = conversations.find(
      (conversation) => conversation.customer_id === user.id
    );

    if (existingConversation) {
      setConversationId(existingConversation.id);
    } else {
      // 🔹 Create a new conversation if none exists
      const newConversation = {
        customer_id: user.id,
        status: "open",
      };

      createConversation(newConversation).then((conversation) => {
        if (conversation?.id) {
          setConversationId(conversation.id);
        }
      });
    }
  }, [conversations, createConversation, loading, user]);

  if (!user || loading) {
    return <LoadingPage />;
  }

  // 🎯 Find the conversation and its messages
  const conversation = conversations.find(
    (conversation) => conversation.id === conversationId
  );
  const messages = conversation?.messages || [];

  const handleSubmit = async () => {
    if (!conversationId) return;

    if (input || file) {
      let mediaUrl = "";

      if (file) {
        // Simulate file upload (Replace with actual upload logic)
        mediaUrl = URL.createObjectURL(file);
      }

      const newMessage = {
        content: input,
        conversation_id: conversationId,
        created_at: new Date().toISOString(),
        direction: "outbound",
        media_url: mediaUrl,
      };

      await createMessage(newMessage);
      setInput("");
      setFile(null);
    }
  };

  const onEmojiClick = (emojiObject: any) => {
    setInput((prev) => prev + emojiObject.emoji);
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
          [...messages].map((message) => (
            <div key={message.id} id={message.id}>
              {generateMessage(message)}
            </div>
          ))
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

const generateMessage = (message: Message) => {
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
      message={message.content}
      media={message.media_url}
      direction={message.direction as "inbound" | "outbound"}
      date={formattedDate}
      status=""
      error=""
    />
  );
};

export default ChatWindow;
