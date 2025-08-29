import React, { useMemo, useState } from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import {
  Conversation,
  useConversationContext,
} from "../../context/ConversationContext";
import LoadingPage from "../pages/loading";
import { useUserContext } from "../../context/UserContext";
import { FiUsers, FiMessageSquare, FiSearch, FiPlus } from "react-icons/fi";
import { HiOutlineUserGroup } from "react-icons/hi";
import { RiCommunityLine } from "react-icons/ri";
import ChatWindow from "../support/chat-window";
import UserPicker from "../support/UserPicker";
import { useGroupContext } from "../../context/GroupContext";
import { useCommunityContext } from "../../context/CommunityContext";
import { useAuthContext } from "../../context/AuthContext";
import CreateGroupModal from "./CreateGroupModal";
import CreateCommunityModal from "./CreateCommunityModal";

// Define types for our messaging system
type ChatType = "direct" | "group" | "community";

interface ChatItem {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  avatar?: string;
  type: ChatType;
  participants?: string[];
}

const InternalChatPage: React.FC = function () {
  const { loading, conversations, createConversation, addParticipant } = useConversationContext();
  const { users } = useUserContext();
  const { user } = useAuthContext();
  const { groups, createGroup } = useGroupContext();
  const { communities, createCommunity } = useCommunityContext();
  
  // Navigation state
  const [activeTab, setActiveTab] = useState<ChatType>("direct");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  
  // Build chat lists from real data
  const directChats: ChatItem[] = useMemo(() => {
    if (!user) return [];
    return conversations
      .filter((c) => c.type === "direct" && !c.group_id && c.participants.some((p) => p.user_id === user.id))
      .map((c) => {
        const otherUserId = c.participants.map((p) => p.user_id).find((id) => id && id !== user.id) ?? null;
        const otherEmail = users.find((u) => u.id === otherUserId)?.email ?? "Direct chat";
        const last = c.messages.at(-1);
        return {
          id: c.id,
          name: otherEmail,
          lastMessage: last?.content ?? "",
          timestamp: last?.created_at ? new Date(last.created_at).toLocaleString() : "",
      unreadCount: 0,
          avatar: "/images/users/default-avatar.png",
      type: "direct",
          participants: c.participants.map((p) => p.user_id ?? ""),
        } as ChatItem;
      });
  }, [conversations, users, user]);

  const groupChats: ChatItem[] = useMemo(() => {
    return groups.map((g) => {
      const conv = conversations.find((c) => c.group_id === g.id);
      const last = conv?.messages.at(-1);
      return {
        id: g.id,
        name: g.name ?? "Group",
        lastMessage: last?.content ?? "",
        timestamp: last?.created_at ? new Date(last.created_at).toLocaleString() : "",
      unreadCount: 0,
      avatar: g.media_url ?? "/images/users/group-avatar.png",
      type: "group",
      } as ChatItem;
    });
  }, [groups, conversations]);

  const communityChats: ChatItem[] = useMemo(() => {
    return communities.map((c) => ({
      id: c.id,
      name: c.name ?? "Community",
      lastMessage: "",
      timestamp: "",
      unreadCount: 0,
      avatar: c.media_url ?? "/images/users/community-avatar.png",
      type: "community",
    }));
  }, [communities]);
  
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  
  // Assemble and filter chats based on active tab and search query (declare hooks before any early returns)
  const allChats = useMemo(() => {
    switch (activeTab) {
      case "direct":
        return directChats;
      case "group":
        return groupChats;
      case "community":
      default:
        return communityChats;
    }
  }, [activeTab, directChats, groupChats, communityChats]);
  
  // Group/community management is handled in their own pages; internal chat consumes them only.
  
  // Handle new direct message
  const handleStartDirectMessage = async (targetUserId: string, userName: string) => {
    try {
      if (!user) return;
      console.log("[InternalChat] Creating direct conversation", { targetUserId, userId: user.id });
      const created = await createConversation({ type: "direct", active: true });
      if (!created?.id) {
        console.warn("[InternalChat] Failed to create conversation");
        return;
      }
      await addParticipant({ conversation_id: created.id, user_id: user.id });
      await addParticipant({ conversation_id: created.id, user_id: targetUserId });
      console.log("[InternalChat] Direct conversation ready", { conversationId: created.id });
      setSelectedChat({ id: created.id, name: userName, type: "direct" });
    setIsUserPickerOpen(false);
    setActiveTab("direct");
    } catch (e) {
      console.error("[InternalChat] Error starting direct message", e);
    }
  };

  // replaced by modal

  // replaced by modal

  // Community management screens are separate; this view only lists them.

  // placeholder for future editing UI

  const getConversationForSelected = (): Conversation | null => {
    if (!selectedChat) return null;
    if (selectedChat.type === "direct") {
      const conv = conversations.find((c) => c.id === selectedChat.id);
      return conv ?? null;
    }
    if (selectedChat.type === "group") {
      const conv = conversations.find((c) => c.group_id === selectedChat.id);
      return conv ?? null;
    }
    return null;
  };
  
  // Sending handled inside ChatWindow via ConversationContext

  if (loading) {
    return <LoadingPage />;
  }

  // (removed duplicate allChats)

  const filteredChats = allChats.filter(chat => {
    // Skip filtering if search query is present - search across all types
    if (searchQuery && searchQuery.length > 2) {
      const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    }
    
    // For community tab, show both communities and groups that are part of communities
    if (activeTab === "community") {
      const isCommunity = chat.type === "community";
      const isGroupInCommunity = chat.type === "group" && chat.name.includes(" - "); // Groups in communities have the format "Community - Group"
      return (isCommunity || isGroupInCommunity);
    } else {
      // For other tabs, standard filtering
      const matchesType = chat.type === activeTab;
      // For group tab, exclude groups that are part of communities
      if (activeTab === "group") {
        const isGroupInCommunity = chat.name.includes(" - ");
        if (isGroupInCommunity) return false;
      }
      return matchesType;
    }
  });

  // Calculate unread counts by chat type (placeholder zeros)
  const unreadCounts = {
    direct: 0,
    group: 0,
    community: 0,
  };

  // Update the renderActions function
  const renderActions = () => {
    if (activeTab === "direct") {
      return (
        <button
          onClick={() => setIsUserPickerOpen(true)}
          className="flex items-center justify-center p-2 w-9 h-9 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
          title="New Chat"
        >
          <FiPlus size={20} />
        </button>
      );
    } else if (activeTab === "group") {
      return (
        <button
          onClick={() => setIsCreateGroupOpen(true)}
          className="flex items-center justify-center p-2 w-9 h-9 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
          title="New Group"
        >
          <FiPlus size={20} />
        </button>
      );
    } else if (activeTab === "community") {
      return (
        <button
          onClick={() => setIsCreateCommunityOpen(true)}
          className="flex items-center justify-center p-2 w-9 h-9 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
          title="New Community"
        >
          <FiPlus size={20} />
        </button>
      );
    }
    return null;
  };

  return (
    <NavbarSidebarLayout>
      <div className="relative grid grid-cols-1 overflow-y-hidden xl:h-[calc(100vh)] xl:grid-cols-4 xl:gap-4">
        {/* Left Sidebar: Navigation + Chat List */}
        <div className="xl:col-span-1 border-r dark:border-gray-700 h-full flex flex-col">
          {/* Navigation Tabs */}
          <div className="flex justify-between p-4 border-b dark:border-gray-700">
            <button 
              onClick={() => setActiveTab("direct")}
              className={`p-2 relative ${activeTab === "direct" ? "text-blue-600 dark:text-blue-500" : "text-gray-500 dark:text-gray-400"}`}
              title="Direct Messages">
              <FiMessageSquare size={24} />
              {unreadCounts.direct > 0 && (
                <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {unreadCounts.direct > 99 ? '99+' : unreadCounts.direct}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab("group")}
              className={`p-2 relative ${activeTab === "group" ? "text-blue-600 dark:text-blue-500" : "text-gray-500 dark:text-gray-400"}`}
              title="Group Chats">
              <HiOutlineUserGroup size={24} />
              {unreadCounts.group > 0 && (
                <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {unreadCounts.group > 99 ? '99+' : unreadCounts.group}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab("community")}
              className={`p-2 relative ${activeTab === "community" ? "text-blue-600 dark:text-blue-500" : "text-gray-500 dark:text-gray-400"}`}
              title="Communities">
              <RiCommunityLine size={24} />
              {unreadCounts.community > 0 && (
                <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {unreadCounts.community > 99 ? '99+' : unreadCounts.community}
                </span>
              )}
            </button>
          </div>
          
          {/* Search and Add Button */}
          <div className="p-4 bg-white dark:bg-gray-800 flex items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiSearch className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder={`Search ${activeTab} messages...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {renderActions()}
          </div>
          
          {/* Chat List */}
          <div className="overflow-y-auto flex-1 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer ${
                    selectedChat?.id === chat.id ? "bg-gray-50 dark:bg-gray-600" : ""
                  }`}
                  onClick={async () => {
                    setSelectedChat(chat);
                    // Auto-create group conversation if missing
                    if (chat.type === "group") {
                      const existing = conversations.find((c) => c.group_id === chat.id);
                      if (!existing) {
                        const created = await createConversation({ type: "group", active: true, group_id: chat.id });
                        if (created?.id && user) {
                          await addParticipant({ conversation_id: created.id, user_id: user.id });
                        }
                      }
                    }
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        className="w-10 h-10 rounded-full"
                        src={chat.avatar || "/images/users/default-avatar.png"}
                        alt={chat.name}
                      />
                      {chat.type === "group" && (
                        <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1">
                          <FiUsers size={10} className="text-white" />
                        </div>
                      )}
                      {chat.type === "community" && (
                        <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1">
                          <RiCommunityLine size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                          {chat.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {chat.timestamp}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                        {chat.lastMessage}
                      </p>
                    </div>
                    {chat.unreadCount && chat.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-500 rounded-full">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No {activeTab} messages found
              </div>
            )}
          </div>
        </div>
        
        {/* Chat Window Area */}
        <div className="col-span-3 h-full">
          {selectedChat ? (
            <div className="h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="relative">
                    <img
                      className="w-10 h-10 rounded-full mr-3"
                      src={selectedChat.avatar || "/images/users/default-avatar.png"}
                      alt={selectedChat.name}
                    />
                    {selectedChat.type === "group" && (
                      <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1">
                        <FiUsers size={10} className="text-white" />
                      </div>
                    )}
                    {selectedChat.type === "community" && (
                      <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1">
                        <RiCommunityLine size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedChat.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedChat.type === "group" && "Group chat"} 
                      {selectedChat.type === "community" && "Community"} 
                      {selectedChat.type === "direct" && "Direct message"}
                    </p>
                  </div>
                </div>
                
                {/* Edit Button placeholder removed for now */}
              </div>
              
              {/* Chat Content */}
              {getConversationForSelected() ? (
              <ChatWindow
                  conversation={getConversationForSelected() as Conversation}
                  messages={(getConversationForSelected() as Conversation).messages}
                />
              ) : (
                <div className="flex items-center justify-center h-full col-span-3">
                  <div className="text-center">
                    <img alt="" src="/images/illustrations/maintenance.svg" className="lg:max-w-md" />
                    <h1 className="text-2xl font-bold dark:text-white">No conversation started yet</h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Select a chat to start a conversation.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full col-span-3">
              <div className="text-center">
                <img
                  alt=""
                  src="/images/illustrations/404.svg"
                  className="lg:max-w-md"
                />
                <h1 className="text-2xl font-bold dark:text-white">
                  Select a conversation to start chatting
                </h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Choose from direct messages, group chats, or communities
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* User Picker Modal */}
      <UserPicker
        isOpen={isUserPickerOpen}
        onClose={() => setIsUserPickerOpen(false)}
        onSelectUser={handleStartDirectMessage}
        users={users}
      />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreate={async ({ name, media_url }) => {
          const row = await createGroup({ name, type: "group", media_url: media_url ?? null });
          console.log("[InternalChat] Group created", row);
          setActiveTab("group");
        }}
      />

      <CreateCommunityModal
        isOpen={isCreateCommunityOpen}
        onClose={() => setIsCreateCommunityOpen(false)}
        onCreate={async ({ name, media_url }) => {
          const row = await createCommunity({ name, media_url: media_url ?? null });
          console.log("[InternalChat] Community created", row);
          setActiveTab("community");
        }}
      />
    </NavbarSidebarLayout>
  );
};

export default InternalChatPage; 