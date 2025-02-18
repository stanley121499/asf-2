/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from "react";
// import { useAlertContext } from "../../../context/AlertContext";
import Picker from "emoji-picker-react";
import { MdOutlineEmojiEmotions } from "react-icons/md";
import {
  Conversation,
  Message,
  MessageInsert,
} from "../../context/ConversationContext";
import { useConversationContext } from "../../context/ConversationContext";
import LoadingPage from "../pages/loading";
import MessageComponent from "../../components/MessageComponent";

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, messages }) => {
  const [input, setInput] = React.useState("");
  const { createMessage } = useConversationContext();
  const [openEmoji, setOpenEmoji] = useState(false);

  const handleSubmit = async () => {
    if (!conversation.id) return;

    const newMessage: MessageInsert = {
      conversation_id: conversation.id,
      content: input,
      direction: "inbound",
      media_url: "",
    };

    createMessage(newMessage);
    setInput("");
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    const chatWindow = document.querySelector(".scrollToBottom");
    if (chatWindow) {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  };

  const onEmojiClick = (emojiObject: any, e: any) => {
    setInput(input + emojiObject.emoji);
  };

  if (!messages || !conversation) {
    return <LoadingPage />;
  }

  return (
    <div className="col-span-3 m-auto mb-5 h-full space-y-6 overflow-hidden overflow-y-auto p-4 lg:pt-6 w-full flex flex-col relative">
      {/* Chat Messages */}
      {/* Scroll to the bottom of the chat window */}
      <div className="flex flex-grow gap-4 xl:h-[calc(100vh-15rem)] overflow-y-auto scrollToBottom flex-col">
        {[...messages].map((message, index) => (
          <div key={message.id} id={message.id.toString()}>
            {generateMessage(message)}
          </div>
        ))}
      </div>
      {/* Chatroom Input */}
      <label htmlFor="chat" className="sr-only">
        Your message
      </label>

      {openEmoji && (
        <div
          className={`absolute bottom-24 left-45 z-10 ${
            openEmoji ? "" : "hidden"
          }`}>
          <Picker onEmojiClick={onEmojiClick} />
        </div>
      )}

      <div className="flex items-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700">
        <button
          type="button"
          className="inline-flex justify-center p-2 text-gray-500 rounded-lg cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600"
          onClick={() => setOpenEmoji(!openEmoji)}>
          <MdOutlineEmojiEmotions className="w-5 h-5" />
          <span className="sr-only">Open Emoji</span>
        </button>
        {/* Input Field */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600"
          onClick={handleSubmit}>
          <svg
            className="w-5 h-5 rotate-90 rtl:-rotate-90"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 18 20">
            <path d="m17.914 18.594-8-18a1 1 0 0 0-1.828 0l-8 18a1 1 0 0 0 1.157 1.376L8 18.281V9a1 1 0 0 1 2 0v9.281l6.758 1.689a1 1 0 0 0 1.156-1.376Z" />
          </svg>
          <span className="sr-only">Send message</span>
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
      direction={message.direction === "inbound" ? "outbound" : "inbound"}
      date={formattedDate}
      status=""
      error=""
    />
  );
};
export default ChatWindow;
