/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState, useRef } from "react";
// import { useAlertContext } from "../../../context/AlertContext";
import Picker from "emoji-picker-react";
import { MdOutlineEmojiEmotions } from "react-icons/md";
import { FiPlus, FiFile, FiImage, FiVideo, FiX } from "react-icons/fi";
import {
  Conversation,
  Message,
  MessageInsert,
} from "../../context/ConversationContext";
import { useConversationContext } from "../../context/ConversationContext";
import LoadingPage from "../pages/loading";

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  onSendMessage?: (content: string) => void;
}

type FileType = "image" | "video" | "document";

interface AttachmentFile {
  id: string;
  file: File;
  preview: string;
  type: FileType;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, messages, onSendMessage }) => {
  const [input, setInput] = React.useState("");
  const { createMessage } = useConversationContext();
  const [openEmoji, setOpenEmoji] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async () => {
    if (!conversation.id) return;

    // Create media_url from attachments
    let mediaUrls = "";
    if (attachments.length > 0) {
      mediaUrls = attachments.map(att => att.preview).join(",");
    }

    const newMessage: MessageInsert = {
      conversation_id: conversation.id,
      content: input,
      direction: "inbound",
      media_url: mediaUrls,
    };

    // Use the provided onSendMessage callback if it exists, otherwise use default behavior
    if (onSendMessage) {
      onSendMessage(input);
    } else {
      createMessage(newMessage);
    }
    
    setInput("");
    setAttachments([]);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Clean up the object URLs created for previews
    return () => {
      attachments.forEach(attachment => {
        URL.revokeObjectURL(attachment.preview);
      });
    };
  }, [attachments]);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const onEmojiClick = (emojiObject: any, e: any) => {
    setInput(input + emojiObject.emoji);
  };

  const handleAttachmentClick = (type: FileType) => {
    setShowAttachmentMenu(false);
    
    if (fileInputRef.current) {
      // Set accept attribute based on file type
      if (type === "image") {
        fileInputRef.current.accept = "image/*";
      } else if (type === "video") {
        fileInputRef.current.accept = "video/*";
      } else {
        fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.txt";
      }

      // Store the file type in a data attribute to access it after file selection
      fileInputRef.current.dataset.fileType = type;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileType = fileInputRef.current?.dataset.fileType as FileType || "document";
    
    const newAttachments = Array.from(files).map(file => {
      const id = Math.random().toString(36).substring(2, 9);
      let preview = "";

      if (fileType === "image" || fileType === "video") {
        preview = URL.createObjectURL(file);
      } else {
        // For documents, we'll just show an icon
        preview = `/images/icons/${getDocumentIcon(file.name)}`;
      }

      return {
        id,
        file,
        preview,
        type: fileType
      };
    });

    setAttachments([...attachments, ...newAttachments]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getDocumentIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'pdf-icon.png';
      case 'doc':
      case 'docx':
        return 'doc-icon.png';
      case 'xls':
      case 'xlsx':
        return 'xls-icon.png';
      default:
        return 'file-icon.png';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter(att => att.id !== id));
  };

  if (!messages || !conversation) {
    return <LoadingPage />;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-700">
      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {[...messages].map((message, index) => (
          <div key={message.id} id={message.id.toString()}>
            {generateMessage(message)}
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="p-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {attachments.map(attachment => (
              <div key={attachment.id} className="relative group">
                {attachment.type === "image" ? (
                  <div className="w-20 h-20 border rounded overflow-hidden">
                    <img 
                      src={attachment.preview} 
                      alt="Attachment preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : attachment.type === "video" ? (
                  <div className="w-20 h-20 border rounded overflow-hidden bg-black flex items-center justify-center">
                    <video 
                      src={attachment.preview} 
                      className="max-w-full max-h-full"
                    />
                    <FiVideo className="absolute text-white text-xl" />
                  </div>
                ) : (
                  <div className="w-20 h-20 border rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <FiFile className="text-gray-500 dark:text-gray-400 text-xl" />
                    <span className="text-xs mt-1 text-center text-gray-600 dark:text-gray-300">
                      {attachment.file.name.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                )}
                <button 
                  onClick={() => removeAttachment(attachment.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiX size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Input Field */}
      <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-start space-x-2">
          <div className="flex-1 relative border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
            <textarea
              className="w-full p-3 text-gray-900 dark:text-white bg-transparent outline-none resize-none min-h-[60px]"
              placeholder="Type your message..."
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="absolute bottom-2 right-2 flex items-center space-x-1">
              <button 
                className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600" 
                title="Add Emoji"
                onClick={() => setOpenEmoji(!openEmoji)}
              >
                <MdOutlineEmojiEmotions size={20} />
              </button>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <div className="relative">
              <button 
                className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600" 
                title="Attach File"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              >
                <FiPlus size={20} />
              </button>
              
              {showAttachmentMenu && (
                <div className="absolute bottom-10 right-0 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <button 
                    className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    onClick={() => handleAttachmentClick("image")}
                  >
                    <FiImage className="mr-2" /> Image
                  </button>
                  <button 
                    className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    onClick={() => handleAttachmentClick("video")}
                  >
                    <FiVideo className="mr-2" /> Video
                  </button>
                  <button 
                    className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    onClick={() => handleAttachmentClick("document")}
                  >
                    <FiFile className="mr-2" /> Document
                  </button>
                </div>
              )}
            </div>
            <button 
              className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-full" 
              title="Send Message"
              onClick={handleSubmit}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Emoji Picker */}
      {openEmoji && (
        <div className="absolute bottom-20 right-20 z-50">
          <Picker onEmojiClick={onEmojiClick} />
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        multiple
      />
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
      hour12: true,
    }
  );

  const isOutbound = message.direction === "inbound";
  
  // Check if the message contains media
  const hasMedia = message.media_url && message.media_url.trim() !== "";
  const mediaUrls = hasMedia ? message.media_url.split(",") : [];

  // For system messages (like "This conversation started today")
  if (message.direction === "system") {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-200 dark:bg-gray-600 rounded-lg px-4 py-2 max-w-[80%]">
          <p className="text-sm text-gray-700 dark:text-gray-200">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  // For regular chat messages (outbound or inbound)
  return (
    <div className={`flex items-end ${isOutbound ? 'justify-end' : ''} mb-4`}>
      {/* Only show avatar for incoming messages or if it's the first in a sequence */}
      {!isOutbound && (
        <img 
          src="/images/users/neil-sims.png" 
          className="w-8 h-8 rounded-full mr-2 flex-shrink-0" 
          alt="User" 
        />
      )}
      
      <div className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'} ${isOutbound ? 'max-w-[85%]' : 'max-w-[75%]'}`}>
        {/* Sender name - only for incoming messages */}
        {!isOutbound && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">
            {message.sender || "Agent"}
          </span>
        )}
        
        {/* Message bubble */}
        <div 
          className={`px-4 py-2 rounded-lg shadow-sm ${
            isOutbound 
              ? 'bg-blue-600 text-white rounded-br-none self-end' 
              : 'bg-white dark:bg-gray-800 rounded-bl-none text-gray-900 dark:text-white self-start'
          }`}
        >
          {/* Message content */}
          {message.content && (
            <div className={isOutbound ? 'text-white' : 'text-gray-900 dark:text-white'}>
              {message.content}
            </div>
          )}
          
          {/* Media attachments */}
          {hasMedia && (
            <div className="mt-2 space-y-2">
              {mediaUrls.map((url, index) => {
                // Determine if it's an image by extension
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url);
                
                if (isImage) {
                  return (
                    <img 
                      key={index} 
                      src={url} 
                      alt="Attachment" 
                      className="rounded max-w-full h-auto" 
                    />
                  );
                } else if (isVideo) {
                  return (
                    <video 
                      key={index} 
                      src={url} 
                      controls 
                      className="rounded max-w-full h-auto" 
                    />
                  );
                } else {
                  // For other file types, show a link
                  return (
                    <a 
                      key={index} 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center p-2 bg-gray-100 dark:bg-gray-700 rounded"
                    >
                      <FiFile className="mr-2" />
                      <span className="text-blue-500 dark:text-blue-400 underline">
                        {url.split('/').pop()}
                      </span>
                    </a>
                  );
                }
              })}
            </div>
          )}
          
          {/* Timestamp */}
          <div className="text-xs text-right mt-1">
            <span className={isOutbound ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}>
              {formattedDate}
            </span>
          </div>
        </div>
      </div>
      
      {/* Avatar for outgoing messages */}
      {isOutbound && (
        <img 
          src="/images/users/bonnie-green.png" 
          className="w-8 h-8 rounded-full ml-2 flex-shrink-0" 
          alt="You" 
        />
      )}
    </div>
  );
};

export default ChatWindow;
