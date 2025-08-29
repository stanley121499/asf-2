/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useMemo, useState } from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import { Conversation, useConversationContext } from "../../context/ConversationContext";
import LoadingPage from "../pages/loading";
import { useUserContext } from "../../context/UserContext";
import { useTicketContext } from "../../context/TicketContext";
import { useAuthContext } from "../../context/AuthContext";
import { 
  FiHeadphones, 
  FiSearch, 
  FiPlus, 
  FiCheckCircle,
  FiUser
} from "react-icons/fi";
import ChatWindow from "./chat-window";
import CreateSupportTicketModal from "../../components/CreateSupportTicketModal";

// Define types for our messaging system
type SupportTicketStatus = "open" | "closed";

const SupportPage: React.FC = function () {
  const { conversations, loading } = useConversationContext();
  const { users } = useUserContext();
  const { tickets, updateTicket } = useTicketContext();
  const { user: authUser } = useAuthContext();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
  // Navigation state
  const [activeTicketTab, setActiveTicketTab] = useState<SupportTicketStatus>("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  const [showAssignedToMe, setShowAssignedToMe] = useState(false);

  // Clear selection when switching tabs (open/closed)
  useEffect(() => {
    setSelectedTicketId(null);
    setSelectedConversation(null);
  }, [activeTicketTab]);
  
  // Real support tickets
  const supportTickets = useMemo(() => {
    return tickets.map((t) => {
      const conv = conversations.find((c) => c.ticket_id === t.id);
      const participantUserId = conv?.participants.find((p) => p.user_id)?.user_id ?? null;
      const participant = users.find((u) => u.id === participantUserId);
      const name = participant?.email || "Customer";
      const detail = participant?.user_detail as Record<string, unknown> | undefined;
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
        id: t.id,
        name,
        lastMessage: lastPreview,
        timestamp: t.created_at ? new Date(t.created_at).toLocaleString() : "",
        unreadCount: undefined,
        status: (t.status === "closed" ? "closed" : "open") as SupportTicketStatus,
        avatar: typeof avatarCandidate === "string" ? avatarCandidate : null,
        assignedAgentId: t.assigned_agent_id ?? null,
      };
    });
  }, [tickets, conversations, users]);
  
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Keep selectedConversation in sync with realtime updates to show new messages instantly
  useEffect(() => {
    if (!selectedTicketId) return;
    const latest = conversations.find((c) => c.ticket_id === selectedTicketId) ?? null;
    setSelectedConversation(latest);
  }, [conversations, selectedTicketId]);
  
  // Function to create a support ticket
  const handleCreateSupportTicket = () => {
    setIsCreateTicketModalOpen(true);
  };

  // Handle ticket creation
  const handleTicketCreated = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setActiveTicketTab("open");
  };

  // Function to create a mock conversation object for tickets without actual conversations
  const createMockConversation = (ticketId: string): Conversation => {
    return {
      id: ticketId,
      created_at: new Date().toISOString(),
      active: true,
      group_id: null,
      ticket_id: ticketId,
      type: "support",
      messages: [],
      participants: [],
    };
  };

  if (loading) {
    return <LoadingPage />;
  }

  // Filter tickets based on active tab and search query
  const filteredTickets = supportTickets.filter(ticket => {
    const matchesStatus = ticket.status === activeTicketTab;
    const matchesSearch = !searchQuery || 
                        ticket.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (ticket.lastMessage && ticket.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAssignee = !showAssignedToMe || (authUser && ticket.assignedAgentId === authUser.id);
    return matchesStatus && matchesSearch && matchesAssignee;
  });

  // Calculate unread counts
  const unreadCounts = {
    open: supportTickets
      .filter(ticket => ticket.status === "open" && ticket.unreadCount && ticket.unreadCount > 0)
      .reduce((sum, ticket) => sum + (ticket.unreadCount || 0), 0),
    closed: supportTickets
      .filter(ticket => ticket.status === "closed" && ticket.unreadCount && ticket.unreadCount > 0)
      .reduce((sum, ticket) => sum + (ticket.unreadCount || 0), 0)
  };

  // Handle ticket selection
  const handleTicketSelect = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    const supportConversation = conversations.find(conv => conv.ticket_id === ticketId);
    setSelectedConversation(supportConversation ?? null);
  };

  
  
  // Function to close a ticket
  const handleCloseTicket = async () => {
    if (!selectedTicketId) return;
    await updateTicket(selectedTicketId, { status: "closed" });
    setActiveTicketTab("closed");
  };
  
  // Function to reopen a ticket
  const handleReopenTicket = async () => {
    if (!selectedTicketId) return;
    await updateTicket(selectedTicketId, { status: "open" });
    setActiveTicketTab("open");
  };

  return (
    <NavbarSidebarLayout>
      <div className="relative grid grid-cols-1 overflow-y-hidden xl:h-[calc(100vh)] xl:grid-cols-4 xl:gap-6 p-4">
        {/* Left Sidebar: Navigation + Ticket List */}
        <div className="xl:col-span-1 border-r dark:border-gray-700 h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {/* Support Tabs */}
          <div className="flex justify-center p-4 border-b dark:border-gray-700">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setActiveTicketTab("open")}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                  activeTicketTab === "open"
                    ? "bg-blue-50 text-blue-700 border-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-400"
                    : "bg-white text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600"
                } relative`}
              >
                Open Tickets
                {unreadCounts.open > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCounts.open > 99 ? '99+' : unreadCounts.open}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTicketTab("closed")}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
                  activeTicketTab === "closed"
                    ? "bg-gray-100 text-gray-700 border-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500"
                    : "bg-white text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600"
                } relative`}
              >
                Closed Tickets
                {unreadCounts.closed > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCounts.closed > 99 ? '99+' : unreadCounts.closed}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Search, Filter and Add Button */}
          <div className="p-4 flex items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiSearch className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder={`Search ${activeTicketTab} tickets...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={showAssignedToMe}
                onChange={(e) => setShowAssignedToMe(e.target.checked)}
              />
              Assigned to me
            </label>
            <button
              onClick={handleCreateSupportTicket}
              className="flex items-center justify-center p-2 w-9 h-9 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors duration-200"
              title="New Ticket"
            >
              <FiPlus size={20} />
            </button>
          </div>
          
          {/* Tickets List */}
          <div className="overflow-y-auto flex-1 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors duration-150 ${
                    selectedTicketId === ticket.id ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500" : ""
                  }`}
                  onClick={() => handleTicketSelect(ticket.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {ticket.avatar ? (
                        <img
                          className="w-10 h-10 rounded-full"
                          src={ticket.avatar}
                          alt={ticket.name}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <FiUser className="text-gray-600 dark:text-gray-200" />
                        </div>
                      )}
                      {ticket.status === "open" && (
                        <div className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-1">
                          <FiHeadphones size={10} className="text-white" />
                        </div>
                      )}
                      {ticket.status === "closed" && (
                        <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1">
                          <FiCheckCircle size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                          {ticket.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {ticket.timestamp}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                        {ticket.lastMessage}
                      </p>
                    </div>
                    {ticket.unreadCount && ticket.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-500 rounded-full">
                        {ticket.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No {activeTicketTab} tickets found
              </div>
            )}
          </div>
        </div>
        
        {/* Chat Window Area */}
        <div className="col-span-3 h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {selectedTicketId ? (
            <div className="h-full flex flex-col">
              {/* Ticket Header */}
              <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="relative">
                    {supportTickets.find(t => t.id === selectedTicketId)?.avatar ? (
                      <img
                        className="w-12 h-12 rounded-full"
                        src={supportTickets.find(t => t.id === selectedTicketId)?.avatar as string}
                        alt={selectedTicketId}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <FiUser className="text-gray-600 dark:text-gray-200" />
                      </div>
                    )}
                    {activeTicketTab === "open" && (
                      <div className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-1">
                        <FiHeadphones size={10} className="text-white" />
                      </div>
                    )}
                    {activeTicketTab === "closed" && (
                      <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1">
                        <FiCheckCircle size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {supportTickets.find(t => t.id === selectedTicketId)?.name ?? "Customer"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Support Ticket #{selectedTicketId.substring(0, 8)} - {activeTicketTab.toUpperCase()}
                    </p>
                  </div>
                </div>
                
                {/* Ticket Actions */}
                <div className="flex items-center space-x-3">
                  {/* Assignment dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Assign to:</span>
                    <select
                      className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-gray-700 dark:text-gray-200"
                      value={supportTickets.find(t => t.id === selectedTicketId)?.assignedAgentId ?? ""}
                      onChange={async (e) => {
                        const agentId = e.target.value || null;
                        if (!selectedTicketId) return;
                        await updateTicket(selectedTicketId, { assigned_agent_id: agentId });
                      }}
                    >
                      <option value="">Unassigned</option>
                      {users
                        .filter(u => {
                          const roleRaw = (u.user_detail as any)?.role;
                          const role = typeof roleRaw === "string" ? roleRaw.toLowerCase() : "";
                          return role !== "customer";
                        })
                        .map(u => (
                          <option key={u.id} value={u.id}>{u.email}</option>
                        ))}
                    </select>
                  </div>
                  {activeTicketTab === "open" ? (
                    <button
                      onClick={handleCloseTicket}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      Close Ticket
                    </button>
                  ) : (
                    <button
                      onClick={handleReopenTicket}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Reopen Ticket
                    </button>
                  )}
                </div>
              </div>
              
              {/* Chat Content */}
              {selectedConversation ? (
                <ChatWindow 
                  conversation={selectedConversation}
                  messages={selectedConversation.messages}
                />
              ) : (
                <ChatWindow
                  conversation={createMockConversation(selectedTicketId)}
                  messages={createMockConversation(selectedTicketId).messages}
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
                  Select a support ticket to start chatting
                </h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Choose from open or closed support tickets
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Support Ticket Modal */}
      <CreateSupportTicketModal
        isOpen={isCreateTicketModalOpen}
        onClose={() => setIsCreateTicketModalOpen(false)}
        onTicketCreated={handleTicketCreated}
      />
    </NavbarSidebarLayout>
  );
};

export default SupportPage;
