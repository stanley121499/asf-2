import React, { useEffect, useMemo, useState } from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import {
  Conversation,
  useConversationContext,
} from "../../context/ConversationContext";
import LoadingPage from "../pages/loading";
import { useUserContext } from "../../context/UserContext";
import { FiUsers, FiMessageSquare, FiSearch, FiPlus, FiUser, FiEdit3 } from "react-icons/fi";
import { HiOutlineUserGroup } from "react-icons/hi";
import { RiCommunityLine } from "react-icons/ri";
import ChatWindow from "../support/chat-window";
import UserPicker from "../support/UserPicker";
import { useGroupContext } from "../../context/GroupContext";
import { useCommunityContext } from "../../context/CommunityContext";
import { useAuthContext } from "../../context/AuthContext";
import CreateGroupModal from "./CreateGroupModal";
import CreateCommunityModal from "./CreateCommunityModal";
import EditGroupModal from "../../components/EditGroupModal";
import EditCommunityModal from "../../components/EditCommunityModal";

// Define types for our messaging system
type ChatType = "direct" | "group" | "community";

interface ChatItem {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  avatar?: string | null;
  type: ChatType;
  participants?: string[];
  parentCommunityId?: string; // For groups within communities
  parentCommunityName?: string; // For display purposes
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
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [isEditCommunityOpen, setIsEditCommunityOpen] = useState(false);
  const [isInviteUsersOpen, setIsInviteUsersOpen] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState<string | null>(null); // Track which group is having its conversation created
  
  // Build chat lists from real data
  const directChats: ChatItem[] = useMemo(() => {
    if (!user) return [];
    return conversations
      .filter((c) => c.type === "direct" && !c.group_id && c.participants.some((p) => p.user_id === user.id))
      .map((c) => {
        // Debug logging for direct messages
        console.log("[DirectChat Debug]", {
          conversationId: c.id,
          currentUserId: user.id,
          participants: c.participants,
          messages: c.messages.length,
          lastMessage: c.messages.at(-1)
        });
        
        // Handle self-conversations (user messaging themselves)
        const participantIds = c.participants.map((p) => p.user_id).filter((id): id is string => typeof id === "string");
        const otherUserId = participantIds.find((id) => id !== user.id) ?? null;
        
        // Check if this is a self-conversation
        const isSelfConversation = participantIds.every((id) => id === user.id) || participantIds.length === 1;
        
        let targetUserId: string | null;
        let displayName: string;
        
        if (isSelfConversation) {
          // Self-conversation: show current user's email with indicator
          targetUserId = user.id;
          displayName = `${user.email} (You)`;
        } else {
          // Regular conversation: find the other participant
          targetUserId = otherUserId ?? user.id; // fallback to current user if no other found
          const otherUser = users.find((u) => u.id === targetUserId);
          displayName = otherUser?.email ?? "Unknown user";
        }
        
        console.log("[DirectChat Debug - Names]", {
          participantIds,
          isSelfConversation,
          targetUserId,
          displayName,
          currentUserEmail: user.email
        });
        
        const last = c.messages.at(-1);
        let lastPreview = "No messages";
        if (last) {
          const content = typeof last.content === "string" ? last.content.trim() : "";
          if (content.length > 0) {
            lastPreview = content;
          } else if (typeof last.media_url === "string" && last.media_url.trim().length > 0) {
            const firstUrl = last.media_url.split(",")[0];
            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(firstUrl);
            const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(firstUrl);
            lastPreview = isImage ? "Photo" : isVideo ? "Video" : "Attachment";
          }
        }
        
        // Get user avatar (for self-conversations, use current user's avatar)
        const targetUser = users.find((u) => u.id === targetUserId);
        const detail = (targetUser?.user_detail ?? {}) as Record<string, unknown>;
        const avatarCandidate = detail
          ? [
              detail["avatar_url"],
              detail["media_url"],
              detail["photo_url"],
              detail["image_url"],
              detail["profile_image"],
              detail["profile_picture"],
              detail["avatar"],
            ].find((v) => typeof v === "string" && (v as string).trim().length > 0)
          : null;
        
        return {
          id: c.id,
          name: displayName,
          lastMessage: lastPreview,
          timestamp: last?.created_at ? new Date(last.created_at).toLocaleString() : "",
          unreadCount: 0,
          avatar: typeof avatarCandidate === "string" ? avatarCandidate : null,
          type: "direct",
          participants: participantIds,
        } as ChatItem;
      });
  }, [conversations, users, user]);

  const groupChats: ChatItem[] = useMemo(() => {
    return groups.map((g) => {
      const conv = conversations.find((c) => c.group_id === g.id);
      const last = conv?.messages.at(-1);
      let lastPreview = "No messages";
      if (last) {
        const content = typeof last.content === "string" ? last.content.trim() : "";
        if (content.length > 0) {
          lastPreview = content;
        } else if (typeof last.media_url === "string" && last.media_url.trim().length > 0) {
          const firstUrl = last.media_url.split(",")[0];
          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(firstUrl);
          const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(firstUrl);
          lastPreview = isImage ? "Photo" : isVideo ? "Video" : "Attachment";
        }
      }
      
      return {
        id: g.id,
        name: g.name ?? "Group",
        lastMessage: lastPreview,
        timestamp: last?.created_at ? new Date(last.created_at).toLocaleString() : "",
        unreadCount: 0,
        avatar: g.media_url ?? null,
        type: "group",
      } as ChatItem;
    });
  }, [groups, conversations]);

  const communityChats: ChatItem[] = useMemo(() => {
    const result: ChatItem[] = [];
    
    communities.forEach((c) => {
      // Add the community itself
      result.push({
        id: c.id,
        name: c.name ?? "Community",
        lastMessage: "Community chat",
        timestamp: "",
        unreadCount: 0,
        avatar: c.media_url ?? null,
        type: "community",
      });
      
      // Add community groups (indented/sub-items in WhatsApp style)
      c.groups.forEach((group) => {
        result.push({
          id: group.id,
          name: group.name ?? "Group",
          lastMessage: "Group chat",
          timestamp: "",
          unreadCount: 0,
          avatar: group.media_url ?? null,
          type: "group",
          parentCommunityId: c.id, // Track which community this group belongs to
          parentCommunityName: c.name ?? "Community",
        });
      });
    });
    
    return result;
  }, [communities]);
  
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  
  // Align UX with support page: clear the right pane when switching tabs
  useEffect(() => {
    setSelectedChat(null);
  }, [activeTab]);

  // Update selected chat when groups data changes (for live updates after editing)
  useEffect(() => {
    if (selectedChat?.type === "group") {
      const updatedGroup = groups.find(g => g.id === selectedChat.id);
      if (updatedGroup) {
        setSelectedChat(prev => prev ? {
          ...prev,
          name: updatedGroup.name ?? prev.name,
          avatar: updatedGroup.media_url ?? prev.avatar,
        } : null);
      }
    }
  }, [groups, selectedChat?.id, selectedChat?.type]);
  
  // Update selected chat when communities data changes (for live updates after editing)
  useEffect(() => {
    if (selectedChat?.type === "community") {
      const updatedCommunity = communities.find(c => c.id === selectedChat.id);
      if (updatedCommunity) {
        setSelectedChat(prev => prev ? {
          ...prev,
          name: updatedCommunity.name ?? prev.name,
          avatar: updatedCommunity.media_url ?? prev.avatar,
        } : null);
      }
    }
  }, [communities, selectedChat?.id, selectedChat?.type]);
  
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

  const handleInviteToGroup = async (targetUserId: string, userName: string) => {
    try {
      if (!user || !selectedChat || selectedChat.type !== "group") {
        console.error("[InternalChat] No group selected for invitation");
        return;
      }

      // Find the group's conversation
      const groupConversation = conversations.find(c => c.group_id === selectedChat.id);
      if (!groupConversation) {
        console.error("[InternalChat] No conversation found for group", selectedChat.id);
        return;
      }

      // Check if user is already a participant
      const existingParticipant = groupConversation.participants?.find(p => p.user_id === targetUserId);
      if (existingParticipant) {
        console.log("[InternalChat] User already in group");
        setIsInviteUsersOpen(false);
        return;
      }

      // Add user to group conversation
      const participant = await addParticipant({
        conversation_id: groupConversation.id,
        user_id: targetUserId,
      });

      if (participant) {
        console.log("[InternalChat] User invited to group successfully", { userId: targetUserId, groupId: selectedChat.id });
      }

      setIsInviteUsersOpen(false);
    } catch (e) {
      console.error("[InternalChat] Error inviting user to group", e);
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

  // Unread counts are not shown in this view for now

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
        <div className="xl:col-span-1 border-r dark:border-gray-700 h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {/* Navigation Tabs */}
          <div className="flex justify-between p-4 border-b dark:border-gray-700">
            <button 
              onClick={() => setActiveTab("direct")}
              className={`p-2 relative ${activeTab === "direct" ? "text-blue-600 dark:text-blue-500" : "text-gray-500 dark:text-gray-400"}`}
              title="Direct Messages">
              <FiMessageSquare size={24} />
              {/* unread badges hidden */}
            </button>
            <button 
              onClick={() => setActiveTab("group")}
              className={`p-2 relative ${activeTab === "group" ? "text-blue-600 dark:text-blue-500" : "text-gray-500 dark:text-gray-400"}`}
              title="Group Chats">
              <HiOutlineUserGroup size={24} />
              {/* unread badges hidden */}
            </button>
            <button 
              onClick={() => setActiveTab("community")}
              className={`p-2 relative ${activeTab === "community" ? "text-blue-600 dark:text-blue-500" : "text-gray-500 dark:text-gray-400"}`}
              title="Communities">
              <RiCommunityLine size={24} />
              {/* unread badges hidden */}
            </button>
          </div>
          
          {/* Search and Add Button */}
          <div className="p-4 bg-white dark:bg-gray-800 flex items-center gap-2">
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
                  } ${chat.parentCommunityId ? "pl-8 border-l-2 border-green-200 dark:border-green-800 ml-4" : ""}`}
                  onClick={async () => {
                    setSelectedChat(chat);
                    // Auto-create group conversation if missing
                    if (chat.type === "group") {
                      const existing = conversations.find((c) => c.group_id === chat.id);
                      if (!existing && creatingConversation !== chat.id) {
                        setCreatingConversation(chat.id);
                        try {
                          const created = await createConversation({ type: "group", active: true, group_id: chat.id });
                          if (created?.id && user) {
                            // Check if user is already a participant before adding
                            const existingParticipant = created.participants?.find(p => p.user_id === user.id);
                            if (!existingParticipant) {
                              await addParticipant({ conversation_id: created.id, user_id: user.id });
                            }
                          }
                        } catch (error) {
                          console.error("[InternalChat] Error creating group conversation:", error);
                        } finally {
                          setCreatingConversation(null);
                        }
                      }
                    }
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {chat.avatar ? (
                        <img
                          className="w-10 h-10 rounded-full"
                          src={chat.avatar}
                          alt={chat.name}
                          onError={(e) => {
                            const el = e.currentTarget as HTMLImageElement;
                            el.style.display = "none";
                            el.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${chat.avatar ? "hidden" : ""} ${
                        chat.type === "group" 
                          ? "bg-gradient-to-br from-blue-400 to-blue-600" 
                          : chat.type === "community"
                          ? "bg-gradient-to-br from-green-400 to-green-600"
                          : "bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-500 dark:to-gray-600"
                      }`}>
                        {chat.type === "group" && (
                          <FiUsers className="text-white" size={18} />
                        )}
                        {chat.type === "community" && (
                          <RiCommunityLine className="text-white" size={18} />
                        )}
                        {chat.type === "direct" && (
                          <FiUser className="text-gray-700 dark:text-gray-200" size={18} />
                        )}
                      </div>
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
                        {chat.parentCommunityId ? `in ${chat.parentCommunityName}` : chat.lastMessage}
                      </p>
                    </div>
                    {/* Unread count hidden for now */}
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
        <div className="col-span-3 h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {selectedChat ? (
            <div className="h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-6 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="relative">
                    {selectedChat.avatar ? (
                      <img
                        className="w-12 h-12 rounded-full"
                        src={selectedChat.avatar}
                        alt={selectedChat.name}
                        onError={(e) => {
                          const el = e.currentTarget as HTMLImageElement;
                          el.style.display = "none";
                          el.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedChat.avatar ? "hidden" : ""} ${
                      selectedChat.type === "group" 
                        ? "bg-gradient-to-br from-blue-400 to-blue-600" 
                        : selectedChat.type === "community"
                        ? "bg-gradient-to-br from-green-400 to-green-600"
                        : "bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-500 dark:to-gray-600"
                    }`}>
                      {selectedChat.type === "group" && (
                        <FiUsers className="text-white" size={20} />
                      )}
                      {selectedChat.type === "community" && (
                        <RiCommunityLine className="text-white" size={20} />
                      )}
                      {selectedChat.type === "direct" && (
                        <FiUser className="text-gray-700 dark:text-gray-200" size={20} />
                      )}
                    </div>
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
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedChat.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedChat.type === "group" && (
                        (() => {
                          const group = groups.find(g => g.id === selectedChat.id);
                          const groupConversation = conversations.find(c => c.group_id === selectedChat.id);
                          const memberCount = groupConversation?.participants?.length || 0;
                          
                          return (
                            <span>
                              {group?.description || "Group chat"}
                              {memberCount > 0 && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">
                                  {memberCount} member{memberCount !== 1 ? 's' : ''}
                                </span>
                              )}
                            </span>
                          );
                        })()
                      )}
                      {selectedChat.type === "community" && (
                        (() => {
                          const community = communities.find(c => c.id === selectedChat.id);
                          return community?.description || "Community";
                        })()
                      )} 
                      {selectedChat.type === "direct" && "Direct message"}
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                {selectedChat.type === "group" && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsInviteUsersOpen(true)}
                      className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                      title="Invite Members"
                    >
                      <FiPlus className="mr-2" size={16} />
                      Invite
                    </button>
                    <button
                      onClick={() => setIsEditGroupOpen(true)}
                      className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                      title="Edit Group"
                    >
                      <FiEdit3 className="mr-2" size={16} />
                      Edit
                    </button>
                  </div>
                )}
                
                {selectedChat.type === "community" && (
                  <button
                    onClick={() => setIsEditCommunityOpen(true)}
                    className="flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors"
                    title="Edit Community"
                  >
                    <FiEdit3 className="mr-2" size={16} />
                    Edit Community
                  </button>
                )}
              </div>
              
              {/* Chat Content */}
              {selectedChat.type === "community" ? (
                // Community Group Creation Interface
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div className="max-w-md w-full space-y-6">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                        <RiCommunityLine className="text-white" size={32} />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedChat.name}
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        {(() => {
                          const community = communities.find(c => c.id === selectedChat.id);
                          return community?.description || "Create groups to organize conversations within this community";
                        })()}
                      </p>
                    </div>
                    
                    {/* Community Groups List */}
                    {(() => {
                      const community = communities.find(c => c.id === selectedChat.id);
                      const communityGroups = community?.groups || [];
                      
                      return (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Groups in this community</h3>
                          
                          {communityGroups.length > 0 ? (
                            <div className="space-y-2">
                              {communityGroups.map((group) => (
                                <div
                                  key={group.id}
                                  className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                  onClick={async () => {
                                    const newChat = {
                                      id: group.id,
                                      name: group.name ?? "Group",
                                      lastMessage: "Group chat",
                                      timestamp: "",
                                      unreadCount: 0,
                                      avatar: group.media_url ?? null,
                                      type: "group" as const,
                                      parentCommunityId: selectedChat.id,
                                      parentCommunityName: selectedChat.name,
                                    };
                                    setSelectedChat(newChat);
                                    
                                    // Auto-create group conversation if missing (same logic as main group list)
                                    const existing = conversations.find((c) => c.group_id === group.id);
                                    if (!existing && creatingConversation !== group.id) {
                                      setCreatingConversation(group.id);
                                      try {
                                        const created = await createConversation({ type: "group", active: true, group_id: group.id });
                                        if (created?.id && user) {
                                          // Check if user is already a participant before adding
                                          const existingParticipant = created.participants?.find(p => p.user_id === user.id);
                                          if (!existingParticipant) {
                                            await addParticipant({ conversation_id: created.id, user_id: user.id });
                                          }
                                        }
                                      } catch (error) {
                                        console.error("[InternalChat] Error creating community group conversation:", error);
                                      } finally {
                                        setCreatingConversation(null);
                                      }
                                    }
                                  }}
                                >
                                  <div className="relative mr-3">
                                    {group.media_url ? (
                                      <img
                                        className="w-10 h-10 rounded-full"
                                        src={group.media_url}
                                        alt={group.name ?? "Group"}
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                        <FiUsers className="text-white" size={18} />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {group.name ?? "Group"}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {group.description || "Group chat"}
                                    </p>
                                  </div>
                                  <FiUsers className="text-gray-400" size={16} />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <FiUsers className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                              <p className="text-gray-500 dark:text-gray-400">No groups created yet</p>
                            </div>
                          )}
                          
                          {/* Create Group Button */}
                          <button
                            onClick={() => setIsCreateGroupOpen(true)}
                            className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <FiPlus className="mr-2" size={16} />
                            Create New Group
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (() => {
                const selectedConversation = getConversationForSelected();
                return selectedConversation ? (
                  <ChatWindow
                      conversation={selectedConversation}
                      messages={selectedConversation.messages}
                    />
                  ) : (
                  <div className="flex items-center justify-center h-full col-span-3">
                    <div className="text-center">
                      <img alt="" src="/images/illustrations/maintenance.svg" className="lg:max-w-md" />
                      <h1 className="text-2xl font-bold dark:text-white">No conversation started yet</h1>
                      <p className="mt-2 text-gray-500 dark:text-gray-400">Select a chat to start a conversation.</p>
                    </div>
                  </div>
                );
              })()}
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

      {/* Invite Users to Group Modal */}
      <UserPicker
        isOpen={isInviteUsersOpen}
        onClose={() => setIsInviteUsersOpen(false)}
        onSelectUser={handleInviteToGroup}
        users={users}
      />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreate={async ({ name, media_url, description }) => {
          // If we're creating from a community, include the community_id
          const communityId = selectedChat?.type === "community" ? selectedChat.id : null;
          
          const row = await createGroup({ 
            name, 
            description: description ?? null,
            type: "group", 
            media_url: media_url ?? null,
            community_id: communityId,
          });
          console.log("[InternalChat] Group created", row);
          
          // If created from community, stay on community tab, otherwise switch to group tab
          if (!communityId) {
            setActiveTab("group");
          }
          
          // If created from within community, automatically select the new group
          if (communityId && row) {
            setSelectedChat({
              id: row.id,
              name: row.name ?? "Group",
              lastMessage: "Group chat",
              timestamp: "",
              unreadCount: 0,
              avatar: row.media_url ?? null,
              type: "group",
              parentCommunityId: communityId,
              parentCommunityName: selectedChat?.name ?? "Community",
            });
          }
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

      <EditGroupModal
        isOpen={isEditGroupOpen}
        onClose={() => setIsEditGroupOpen(false)}
        onSaved={(updatedGroup) => {
          // Force immediate update of selected chat with new data
          if (selectedChat?.type === "group" && selectedChat.id === updatedGroup.id) {
            setSelectedChat({
              ...selectedChat,
              name: updatedGroup.name,
              avatar: updatedGroup.media_url,
            });
          }
        }}
        group={selectedChat?.type === "group" ? 
          groups.find(g => g.id === selectedChat.id) ?? {
            id: selectedChat.id,
            name: selectedChat.name,
            description: null,
            media_url: selectedChat.avatar ?? null,
          } : null}
      />

      <EditCommunityModal
        isOpen={isEditCommunityOpen}
        onClose={() => setIsEditCommunityOpen(false)}
        onSaved={(updatedCommunity) => {
          // Force immediate update of selected chat with new data
          if (selectedChat?.type === "community" && selectedChat.id === updatedCommunity.id) {
            setSelectedChat({
              ...selectedChat,
              name: updatedCommunity.name,
              avatar: updatedCommunity.media_url,
            });
          }
        }}
        community={selectedChat?.type === "community" ? 
          communities.find(c => c.id === selectedChat.id) ?? {
            id: selectedChat.id,
            name: selectedChat.name,
            description: null,
            media_url: selectedChat.avatar ?? null,
          } : null}
      />
    </NavbarSidebarLayout>
  );
};

export default InternalChatPage; 