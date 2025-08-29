/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState, useRef } from "react";
// import { useAlertContext } from "../../../context/AlertContext";
import Picker from "emoji-picker-react";
import { MdOutlineEmojiEmotions } from "react-icons/md";
import { FiPlus, FiFile, FiImage, FiVideo, FiX, FiUser } from "react-icons/fi";
import { Conversation, ChatMessageRow, useConversationContext } from "../../context/ConversationContext";
import LoadingPage from "../pages/loading";
import { useAuthContext } from "../../context/AuthContext";
import { useUserContext } from "../../context/UserContext";
import { uploadToMedias } from "../../utils/upload";

interface ChatWindowProps {
  conversation: Conversation;
  messages: ChatMessageRow[];
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
  const { user } = useAuthContext();
  const { users } = useUserContext();

  const handleSubmit = async () => {
    if (!conversation.id || !user) return;
    // Upload any attachments to Supabase 'medias' bucket and get public URLs
    let uploadedUrls: string[] = [];
    if (attachments.length > 0) {
      try {
        uploadedUrls = await Promise.all(
          attachments.map((att) => uploadToMedias(att.file, "chat-messages"))
        );
      } catch (e) {
        // Failing to upload should not send a broken message; stop here
        console.error("[SupportChat] Failed to upload attachment(s)", e);
        return;
      }
    }

    const payload = {
      conversation_id: conversation.id,
      content: input,
      created_at: new Date().toISOString(),
      media_url: uploadedUrls.join(","),
      user_id: user.id,
      type: uploadedUrls.length > 0 ? "media" : "text",
    } as const;

    if (onSendMessage) {
      onSendMessage(input);
    } else {
      await createMessage(payload);
    }
    
    setInput("");
    setAttachments([]);
  };

  // Only auto-scroll to bottom when new messages are added, not when opening chat
  const prevMessagesLength = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      scrollToBottom();
    }
    prevMessagesLength.current = messages.length;
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

  type EmojiClickData = { emoji: string };
  const onEmojiClick = (emojiObject: EmojiClickData) => {
    setInput((prev) => `${prev}${emojiObject.emoji}`);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const resolveUserAvatar = (userId: string | null | undefined): string | null => {
    if (!userId) return null;
    const u = users.find((x) => x.id === userId);
    const d = (u?.user_detail ?? {}) as Record<string, unknown>;
    const candidates = [
      d["avatar_url"],
      d["media_url"],
      d["photo_url"],
      d["image_url"],
      d["profile_image"],
      d["profile_picture"],
      d["avatar"],
    ];
    const url = candidates.find((v) => typeof v === "string" && (v as string).trim().length > 0);
    return (typeof url === "string" ? url : null);
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
    <div className="flex-1 flex flex-col h-full min-h-0">
      {/* Chat Messages */}
      <div className="flex-1 min-h-0 p-6 overflow-y-auto space-y-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-700">
        {[...messages].map((message) => {
          const isOutbound = user ? message.user_id === user.id : false;
          const inboundAvatar = resolveUserAvatar(message.user_id);
          const outboundAvatar = resolveUserAvatar(user?.id ?? null);
          return (
            <div key={message.id} id={message.id.toString()}>
              {generateMessage(message, isOutbound, inboundAvatar, outboundAvatar)}
            </div>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-inner">
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
      <div className="p-6 border-t dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="flex-1 relative rounded-2xl bg-gray-50 dark:bg-gray-700 focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-400 transition-all shadow-sm">
            <textarea
              className="w-full p-4 text-gray-900 dark:text-white bg-transparent outline-none resize-none min-h-[64px] placeholder-gray-500 dark:placeholder-gray-400 rounded-2xl border-0"
              placeholder="Type your message..."
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="absolute bottom-3 right-3 flex items-center space-x-2">
              <button 
                className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500 rounded-full hover:bg-blue-50 dark:hover:bg-gray-600 transition-all duration-200" 
                title="Add Emoji"
                onClick={() => setOpenEmoji(!openEmoji)}
              >
                <MdOutlineEmojiEmotions size={22} />
              </button>
            </div>
          </div>
          <div className="flex flex-col space-y-3">
            <div className="relative">
              <button 
                className="p-3 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500 rounded-full hover:bg-blue-50 dark:hover:bg-gray-600 transition-all duration-200 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500" 
                title="Attach File"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              >
                <FiPlus size={20} />
              </button>
              
              {showAttachmentMenu && (
                <div className="absolute bottom-14 right-0 bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 z-10">
                  <button 
                    className="flex items-center p-3 hover:bg-blue-50 dark:hover:bg-gray-700 w-full text-left transition-colors group"
                    onClick={() => handleAttachmentClick("image")}
                  >
                    <FiImage className="mr-3 text-blue-500 group-hover:text-blue-600" size={18} /> 
                    <span className="text-gray-700 dark:text-gray-300">Image</span>
                  </button>
                  <button 
                    className="flex items-center p-3 hover:bg-purple-50 dark:hover:bg-gray-700 w-full text-left transition-colors group"
                    onClick={() => handleAttachmentClick("video")}
                  >
                    <FiVideo className="mr-3 text-purple-500 group-hover:text-purple-600" size={18} /> 
                    <span className="text-gray-700 dark:text-gray-300">Video</span>
                  </button>
                  <button 
                    className="flex items-center p-3 hover:bg-green-50 dark:hover:bg-gray-700 w-full text-left transition-colors group"
                    onClick={() => handleAttachmentClick("document")}
                  >
                    <FiFile className="mr-3 text-green-500 group-hover:text-green-600" size={18} /> 
                    <span className="text-gray-700 dark:text-gray-300">Document</span>
                  </button>
                </div>
              )}
            </div>
            <button 
              className="p-3 text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:shadow-none" 
              title="Send Message"
              onClick={handleSubmit}
              disabled={!input.trim() && attachments.length === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Emoji Picker */}
      {openEmoji && (
        <div className="absolute bottom-24 right-24 z-50 shadow-2xl rounded-xl overflow-hidden">
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

const generateMessage = (
  message: ChatMessageRow,
  isOutbound: boolean,
  inboundAvatarUrl: string | null,
  outboundAvatarUrl: string | null
) => {
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
  
  // Check if the message contains media
  const hasMedia = typeof message.media_url === "string" && message.media_url.trim() !== "";
  const mediaUrls = hasMedia ? (message.media_url as string).split(",") : [];

  // For regular chat messages (outbound or inbound)
  return (
    <div className={`flex items-end ${isOutbound ? 'justify-end' : ''} mb-6 group`}>
      {/* Only show avatar for incoming messages or if it's the first in a sequence */}
      {!isOutbound && (
        <div className="flex-shrink-0 mr-3">
          {inboundAvatarUrl ? (
            <img
              src={inboundAvatarUrl}
              className="w-10 h-10 rounded-full shadow-md border-2 border-white dark:border-gray-700"
              alt="User"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-500 dark:to-gray-600 flex items-center justify-center shadow-md">
              <FiUser className="text-gray-700 dark:text-gray-200" size={18} />
            </div>
          )}
        </div>
      )}
      
      <div className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'} ${isOutbound ? 'max-w-[80%]' : 'max-w-[75%]'}`}>
        {/* Sender name - only for incoming messages */}
        {/* Optionally show sender info here if you enrich the message with joined user profile */}
        
        {/* Message bubble */}
        <div 
          className={`px-5 py-3 rounded-2xl shadow-md transform transition-all duration-200 hover:shadow-lg ${
            isOutbound 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md self-end ml-12' 
              : 'bg-white dark:bg-gray-800 rounded-bl-md text-gray-900 dark:text-white self-start mr-12 border border-gray-100 dark:border-gray-700'
          }`}
        >
          {/* Message content */}
          {message.content && (
            <div className={`leading-relaxed ${isOutbound ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
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
                      className="rounded-xl max-w-[300px] max-h-[400px] w-auto h-auto object-contain shadow-md hover:shadow-lg transition-shadow" 
                    />
                  );
                } else if (isVideo) {
                  return (
                    <video 
                      key={index} 
                      src={url} 
                      controls 
                      className="rounded-xl max-w-[300px] max-h-[400px] w-auto h-auto object-contain shadow-md" 
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
                      className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                    >
                      <FiFile className="mr-3 text-gray-500 dark:text-gray-400" size={18} />
                      <span className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                        {url.split('/').pop()}
                      </span>
                    </a>
                  );
                }
              })}
            </div>
          )}
          
          {/* Timestamp */}
          <div className={`text-xs mt-2 ${isOutbound ? 'text-right' : 'text-left'}`}>
            <span className={`opacity-75 transition-opacity group-hover:opacity-100 ${isOutbound ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
              {formattedDate}
            </span>
          </div>
        </div>
      </div>
      
      {/* Avatar for outgoing messages */}
      {isOutbound && (
        <div className="flex-shrink-0 ml-3">
          {outboundAvatarUrl ? (
            <img
              src={outboundAvatarUrl}
              className="w-10 h-10 rounded-full shadow-md border-2 border-white dark:border-gray-700"
              alt="You"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
              <FiUser className="text-white" size={18} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
