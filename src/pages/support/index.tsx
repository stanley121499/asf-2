/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import {
  Conversation,
  useConversationContext,
  Message
} from "../../context/ConversationContext";
import LoadingPage from "../pages/loading";
import { useUserContext } from "../../context/UserContext";
import { FiUsers, FiMessageSquare, FiHeadphones, FiSearch, FiPlus, FiEdit } from "react-icons/fi";
import { HiOutlineUserGroup } from "react-icons/hi";
import { RiCommunityLine } from "react-icons/ri";
import ChatWindow from "./chat-window";
import GroupManagement, { Group } from "./GroupManagement";
import UserPicker from "./UserPicker";
import CommunityView from "./CommunityView";
import { v4 as uuidv4 } from "uuid";

// Define types for our messaging system
type ChatType = "direct" | "group" | "community" | "support";

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

const SupportPage: React.FC = function () {
  const { conversations, loading } = useConversationContext();
  const { users } = useUserContext();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
  // Navigation state
  const [activeTab, setActiveTab] = useState<ChatType>("direct");
  const [searchQuery, setSearchQuery] = useState("");
  const [isGroupManagementOpen, setIsGroupManagementOpen] = useState(false);
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);
  const [isCommunityViewOpen, setIsCommunityViewOpen] = useState(false);
  
  // Mock data for groups and communities
  const [groups, setGroups] = useState<Group[]>([
    {
      id: "group-1",
      name: "Marketing Team",
      description: "Group for marketing team discussions",
      avatar: "/images/users/group-avatar.png",
      members: [
        {
          id: "user-1",
          name: "John Smith",
          email: "john@example.com",
          role: "admin"
        },
        {
          id: "user-2",
          name: "Sarah Johnson",
          email: "sarah@example.com",
          role: "member"
        }
      ],
      createdAt: new Date().toISOString(),
      type: "group",
      createdBy: "user-1"
    },
    {
      id: "community-1",
      name: "Engineering",
      description: "Community for engineering discussions",
      avatar: "/images/users/community-avatar.png",
      members: [
        {
          id: "user-1",
          name: "John Smith",
          email: "john@example.com",
          role: "admin"
        },
        {
          id: "user-3",
          name: "Michael Brown",
          email: "michael@example.com",
          role: "member"
        }
      ],
      createdAt: new Date().toISOString(),
      type: "community",
      createdBy: "user-1"
    },
    {
      id: "group-3",
      name: "Engineering - Frontend Team",
      description: "Frontend development discussions",
      avatar: "/images/users/group-avatar.png",
      members: [
        {
          id: "user-1",
          name: "John Smith",
          email: "john@example.com",
          role: "admin"
        },
        {
          id: "user-3",
          name: "Michael Brown",
          email: "michael@example.com",
          role: "member"
        },
        {
          id: "user-4",
          name: "Emily Davis",
          email: "emily@example.com",
          role: "member"
        }
      ],
      createdAt: new Date().toISOString(),
      type: "group",
      createdBy: "user-1"
    }
  ]);
  
  // Mock data for UI demonstration - would be replaced with real data
  const [mockChats, setMockChats] = useState<ChatItem[]>([
    {
      id: "direct-1",
      name: "John Smith",
      lastMessage: "Can you help me with the project?",
      timestamp: "2 min ago",
      unreadCount: 3,
      avatar: "/images/users/neil-sims.png",
      type: "direct",
    },
    {
      id: "direct-2",
      name: "Sarah Johnson",
      lastMessage: "Meeting scheduled for tomorrow",
      timestamp: "1 hour ago",
      unreadCount: 0,
      avatar: "/images/users/bonnie-green.png",
      type: "direct",
    },
    {
      id: "group-2",
      name: "Project Alpha",
      lastMessage: "Sprint review happening today",
      timestamp: "Yesterday",
      unreadCount: 0,
      avatar: "/images/users/group-avatar.png",
      type: "group",
      participants: ["user-1", "user-4", "user-5"]
    },
    {
      id: "community-2",
      name: "Company Announcements",
      lastMessage: "Office closed on Friday for maintenance",
      timestamp: "1 week ago",
      unreadCount: 0,
      avatar: "/images/users/community-avatar.png",
      type: "community",
    },
    {
      id: "group-3",
      name: "Engineering - Frontend Team",
      lastMessage: "Has anyone reviewed the new React components?",
      timestamp: "10 min ago",
      unreadCount: 2,
      avatar: "/images/users/group-avatar.png",
      type: "group",
      participants: ["user-1", "user-3", "user-4"]
    },
  ]);
  
  // Add a new state to track mock messages for non-support chats
  const [mockChatMessages, setMockChatMessages] = useState<Record<string, Message[]>>({});

  // Initialize mock messages for each chat
  useEffect(() => {
    const newMockMessages: Record<string, Message[]> = {};
    
    // Create mock messages for each chat that isn't a support chat
    [...mockChats].forEach(chat => {
      if (chat.type !== "support" && !newMockMessages[chat.id]) {
        // Create system message
        const systemMessage: Message = {
          id: `system-${chat.id}`,
          conversation_id: chat.id,
          content: chat.type === "direct" 
            ? "This conversation started today" 
            : chat.type === "group" 
              ? "You joined this group" 
              : "Welcome to the community",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          direction: "system",
          media_url: "",
          sender: "System"
        };
        
        // Create a message from the other person
        const otherPersonMessage: Message = {
          id: `incoming-${chat.id}`,
          conversation_id: chat.id,
          content: "Hi there! This is a sample message to demonstrate the chat interface.",
          created_at: new Date(Date.now() - 300000).toISOString(),
          direction: "outbound",
          media_url: "",
          sender: chat.name
        };
        
        // Create a reply message
        const replyMessage: Message = {
          id: `reply-${chat.id}`,
          conversation_id: chat.id,
          content: "Thanks for the message! I'm reviewing the sample chat interface.",
          created_at: new Date(Date.now() - 240000).toISOString(),
          direction: "inbound",
          media_url: "",
          sender: "You"
        };
        
        // Create another message from the other person
        const followUpMessage: Message = {
          id: `followup-${chat.id}`,
          conversation_id: chat.id,
          content: "Great! Let me know if you have any questions about it.",
          created_at: new Date(Date.now() - 180000).toISOString(),
          direction: "outbound",
          media_url: "",
          sender: chat.name
        };
        
        newMockMessages[chat.id] = [systemMessage, otherPersonMessage, replyMessage, followUpMessage];
      }
    });
    
    setMockChatMessages(newMockMessages);
  }, [mockChats]);
  
  // Sample support tickets based on the existing conversations
  const supportTickets = conversations.map(conv => ({
    id: conv.id,
    name: users.find(user => user.id === conv.customer_id)?.email || "Unknown User",
    lastMessage: conv.messages[0]?.content || "No messages",
    timestamp: conv.created_at ? new Date(conv.created_at).toLocaleString() : "Unknown time",
    unreadCount: 0,
    type: "support" as ChatType,
    avatar: "/images/users/default-avatar.png",
  }));
  
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);
  const [communityToEdit, setCommunityToEdit] = useState<Group | null>(null);
  
  // Group management functions
  const handleCreateGroup = (newGroup: Omit<Group, "id" | "createdAt">) => {
    const group: Group = {
      ...newGroup,
      id: `${newGroup.type}-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setGroups([...groups, group]);
    setIsGroupManagementOpen(false);
  };

  const handleUpdateGroup = (updatedGroup: Group) => {
    setGroups(groups.map(group => 
      group.id === updatedGroup.id ? updatedGroup : group
    ));
    setIsGroupManagementOpen(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups(groups.filter(group => group.id !== groupId));
  };
  
  // Handle new direct message
  const handleStartDirectMessage = (userId: string, userName: string) => {
    // In a real application, this would create a new conversation in the backend
    const newDirectChat: ChatItem = {
      id: `direct-${Date.now()}`,
      name: userName,
      lastMessage: "Start a conversation",
      timestamp: "Just now",
      unreadCount: 0,
      avatar: "/images/users/default-avatar.png",
      type: "direct",
    };
    
    setMockChats(prev => [...prev, newDirectChat]);
    setSelectedChat(newDirectChat);
    setIsUserPickerOpen(false);
    setActiveTab("direct");
  };

  // Function to handle creating a new community
  const handleCreateCommunity = (community: Omit<Group, "id" | "createdAt">) => {
    const newCommunity: Group = {
      ...community,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    
    setGroups(prevGroups => [...prevGroups, newCommunity]);
    
    // Create a new chat item for the community
    const newChatItem: ChatItem = {
      id: uuidv4(),
      name: community.name,
      lastMessage: "Community created",
      timestamp: new Date().toISOString(),
      unreadCount: 0,
      type: "community",
      avatar: "/images/users/community-avatar.png"
    };
    
    setMockChats(prevChats => [...prevChats, newChatItem]);
  };

  // Function to handle updating a community
  const handleUpdateCommunity = (updatedCommunity: Group) => {
    setGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === updatedCommunity.id ? updatedCommunity : group
      )
    );
    
    // Update the corresponding chat item
    setMockChats(prevChats => 
      prevChats.map(chat => {
        if (chat.type === "community" && chat.name === updatedCommunity.name) {
          return {
            ...chat,
            name: updatedCommunity.name,
          };
        }
        return chat;
      })
    );
  };

  // Function to handle deleting a community
  const handleDeleteCommunity = (communityId: string) => {
    const communityToDelete = groups.find(group => group.id === communityId);
    if (!communityToDelete) return;
    
    // Delete the community
    setGroups(prevGroups => prevGroups.filter(group => group.id !== communityId));
    
    // Delete the corresponding chat item
    setMockChats(prevChats => 
      prevChats.filter(chat => 
        !(chat.type === "community" && chat.name === communityToDelete.name)
      )
    );
    
    // Delete all groups in this community
    const communityGroups = groups.filter(group => 
      group.type === "group" && 
      group.name.startsWith(communityToDelete.name)
    );
    
    communityGroups.forEach(group => {
      handleDeleteGroup(group.id);
    });
  };

  // Function to create a support ticket
  const handleCreateSupportTicket = () => {
    // In a real implementation, this would create a new support ticket
    const newTicket: ChatItem = {
      id: `support-${Date.now()}`,
      name: "New Support Ticket",
      lastMessage: "Ticket created - awaiting response",
      timestamp: new Date().toISOString(),
      unreadCount: 0,
      type: "support",
      avatar: "/images/users/default-avatar.png"
    };
    
    setMockChats(prev => [...prev, newTicket]);
    setSelectedChat(newTicket);
  };

  // Function to find a group or community by ID or match by name
  const findGroupById = (id: string): Group | undefined => {
    // First try to find by ID
    const foundGroup = groups.find(group => group.id === id);
    if (foundGroup) return foundGroup;
    
    // If not found by ID, try to find by name
    // This is important for community editing where the chat ID might not match the community ID
    const foundChat = mockChats.find(chat => chat.id === id);
    if (foundChat) {
      return groups.find(group => group.name === foundChat.name);
    }
    
    return undefined;
  };

  // Function to open edit modal for current chat
  const handleEditCurrentChat = () => {
    if (!selectedChat) return;
    
    // Find the group/community by id, not by name
    const groupToEdit = findGroupById(selectedChat.id);
    if (!groupToEdit) return;
    
    if (groupToEdit.type === "community") {
      // Set the community as the one to edit in the CommunityView
      setCommunityToEdit(groupToEdit);
      setIsCommunityViewOpen(true);
    } else {
      setGroupToEdit(groupToEdit);
      setIsGroupManagementOpen(true);
    }
  };

  // Function to create a mock conversation object for non-support chats
  const createMockConversation = (chatId: string): Conversation => {
    return {
      id: chatId,
      customer_id: "mock-customer",
      status: "active",
      created_at: new Date().toISOString(),
      messages: mockChatMessages[chatId] || []
    };
  };

  if (loading) {
    return <LoadingPage />;
  }

  // Filter chats based on active tab and search query
  const filteredChats = [...mockChats, ...supportTickets].filter(chat => {
    // For community tab, show both communities and groups that are part of communities
    if (activeTab === "community") {
      const isCommunity = chat.type === "community";
      const isGroupInCommunity = chat.type === "group" && chat.name.includes(" - "); // Groups in communities have the format "Community - Group"
      const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));
      return (isCommunity || isGroupInCommunity) && matchesSearch;
    } else {
      // For other tabs, standard filtering
      const matchesType = chat.type === activeTab;
      // For group tab, exclude groups that are part of communities
      if (activeTab === "group") {
        const isGroupInCommunity = chat.name.includes(" - ");
        if (isGroupInCommunity) return false;
      }
      const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    }
  });

  // Calculate unread counts by chat type
  const unreadCounts = {
    direct: [...mockChats, ...supportTickets]
      .filter(chat => chat.type === "direct" && chat.unreadCount && chat.unreadCount > 0)
      .reduce((sum, chat) => sum + (chat.unreadCount || 0), 0),
    group: [...mockChats, ...supportTickets]
      .filter(chat => chat.type === "group" && chat.unreadCount && chat.unreadCount > 0)
      .reduce((sum, chat) => sum + (chat.unreadCount || 0), 0),
    community: [...mockChats, ...supportTickets]
      .filter(chat => chat.type === "community" && chat.unreadCount && chat.unreadCount > 0)
      .reduce((sum, chat) => sum + (chat.unreadCount || 0), 0),
    support: [...mockChats, ...supportTickets]
      .filter(chat => chat.type === "support" && chat.unreadCount && chat.unreadCount > 0)
      .reduce((sum, chat) => sum + (chat.unreadCount || 0), 0)
  };

  // Handle chat selection
  const handleChatSelect = (chat: ChatItem) => {
    setSelectedChat(chat);
    if (chat.type === "support") {
      const supportConversation = conversations.find(conv => conv.id === chat.id);
      if (supportConversation) {
        setSelectedConversation(supportConversation);
      }
    } else {
      setSelectedConversation(null);
    }
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
          onClick={() => setIsGroupManagementOpen(true)}
          className="flex items-center justify-center p-2 w-9 h-9 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
          title="New Group"
        >
          <FiPlus size={20} />
        </button>
      );
    } else if (activeTab === "community") {
      return (
        <button
          onClick={() => setIsCommunityViewOpen(true)}
          className="flex items-center justify-center p-2 w-9 h-9 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
          title="Manage Communities"
        >
          <FiPlus size={20} />
        </button>
      );
    } else if (activeTab === "support") {
      return (
        <button
          onClick={handleCreateSupportTicket}
          className="flex items-center justify-center p-2 w-9 h-9 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
          title="New Ticket"
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
            <button 
              onClick={() => setActiveTab("support")}
              className={`p-2 relative ${activeTab === "support" ? "text-blue-600 dark:text-blue-500" : "text-gray-500 dark:text-gray-400"}`}
              title="Support Tickets">
              <FiHeadphones size={24} />
              {unreadCounts.support > 0 && (
                <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {unreadCounts.support > 99 ? '99+' : unreadCounts.support}
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
                  onClick={() => handleChatSelect(chat)}
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
                      {chat.type === "support" && (
                        <div className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-1">
                          <FiHeadphones size={10} className="text-white" />
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
                    {selectedChat.type === "support" && (
                      <div className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-1">
                        <FiHeadphones size={10} className="text-white" />
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
                      {selectedChat.type === "support" && `Support Ticket #${selectedChat.id.substring(0, 8)}`}
                    </p>
                  </div>
                </div>
                
                {/* Edit Button - Only show for groups and communities */}
                {(selectedChat.type === "group" || selectedChat.type === "community") && (
                  <button
                    onClick={handleEditCurrentChat}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500"
                    title={`Edit ${selectedChat.type}`}
                  >
                    <FiEdit size={20} />
                  </button>
                )}
                
                {selectedChat.type === "support" && (
                  <button className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500" title="View Details">
                    <FiEdit size={20} />
                  </button>
                )}
              </div>
              
              {/* Chat Content - Now using ChatWindow for all types */}
              {selectedChat.type === "support" && selectedConversation ? (
                <ChatWindow 
                  conversation={selectedConversation}
                  messages={selectedConversation.messages}
                />
              ) : (
                <ChatWindow
                  conversation={createMockConversation(selectedChat.id)}
                  messages={mockChatMessages[selectedChat.id] || []}
                />
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
                  Choose from direct messages, group chats, communities, or support tickets
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Group Management Modal - Only for groups now, not communities */}
      <GroupManagement
        isOpen={isGroupManagementOpen}
        onClose={() => {
          setIsGroupManagementOpen(false);
          setGroupToEdit(null);
        }}
        groups={groups.filter(group => group.type === "group")}
        onCreateGroup={handleCreateGroup}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
        initialGroup={groupToEdit}
      />
      
      {/* User Picker Modal */}
      <UserPicker
        isOpen={isUserPickerOpen}
        onClose={() => setIsUserPickerOpen(false)}
        onSelectUser={handleStartDirectMessage}
        users={users}
      />

      {/* Community View Modal */}
      <CommunityView
        isOpen={isCommunityViewOpen}
        onClose={() => {
          setIsCommunityViewOpen(false);
          setCommunityToEdit(null);
        }}
        communities={groups.filter(group => group.type === "community")}
        groups={groups}
        onCreateCommunity={handleCreateCommunity}
        onUpdateCommunity={handleUpdateCommunity}
        onDeleteCommunity={handleDeleteCommunity}
        onCreateGroup={handleCreateGroup}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
        communityToEdit={communityToEdit}
      />
    </NavbarSidebarLayout>
  );
};

export default SupportPage;
