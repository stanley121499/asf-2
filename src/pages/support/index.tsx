/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useMemo, useState } from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import { Conversation, useConversationContext } from "../../context/ConversationContext";
import LoadingPage from "../pages/loading";
import { useUserContext } from "../../context/UserContext";
import { useTicketContext } from "../../context/TicketContext";
import { 
  FiHeadphones, 
  FiSearch, 
  FiPlus, 
  FiEdit,
  FiCheckCircle 
} from "react-icons/fi";
import ChatWindow from "./chat-window";

// Define types for our messaging system
type SupportTicketStatus = "open" | "closed";

const SupportPage: React.FC = function () {
  const { conversations, loading } = useConversationContext();
  const { users } = useUserContext();
  const { tickets, updateTicket } = useTicketContext();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
  // Navigation state
  const [activeTicketTab, setActiveTicketTab] = useState<SupportTicketStatus>("open");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Real support tickets
  const supportTickets = useMemo(() => {
    return tickets.map((t) => {
      const conv = conversations.find((c) => c.ticket_id === t.id);
      const participantUserId = conv?.participants.find((p) => p.user_id)?.user_id ?? null;
      const name = users.find((u) => u.id === participantUserId)?.email || "Customer";
      return {
        id: t.id,
        name,
        lastMessage: conv?.messages.at(-1)?.content || "No messages",
        timestamp: t.created_at ? new Date(t.created_at).toLocaleString() : "",
        unreadCount: 0,
        status: (t.status === "closed" ? "closed" : "open") as SupportTicketStatus,
        avatar: "/images/users/default-avatar.png",
      };
    });
  }, [tickets, conversations, users]);
  
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Function to create a support ticket
  const handleCreateSupportTicket = () => {
    // Creation handled on customer side; support manages existing tickets only.
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
    return matchesStatus && matchesSearch;
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
      <div className="relative grid grid-cols-1 overflow-y-hidden xl:h-[calc(100vh)] xl:grid-cols-4 xl:gap-4">
        {/* Left Sidebar: Navigation + Ticket List */}
        <div className="xl:col-span-1 border-r dark:border-gray-700 h-full flex flex-col">
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
          
          {/* Search and Add Button */}
          <div className="p-4 bg-white dark:bg-gray-800 flex items-center">
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
            <button
              onClick={handleCreateSupportTicket}
              className="flex items-center justify-center p-2 w-9 h-9 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
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
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer ${
                    selectedTicketId === ticket.id ? "bg-gray-50 dark:bg-gray-600" : ""
                  }`}
                  onClick={() => handleTicketSelect(ticket.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        className="w-10 h-10 rounded-full"
                        src={ticket.avatar || "/images/users/default-avatar.png"}
                        alt={ticket.name}
                      />
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
        <div className="col-span-3 h-full">
          {selectedTicketId ? (
            <div className="h-full flex flex-col">
              {/* Ticket Header */}
              <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="relative">
                    <img
                      className="w-10 h-10 rounded-full mr-3"
                      src={"/images/users/default-avatar.png"}
                      alt={selectedTicketId}
                    />
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
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {supportTickets.find(t => t.id === selectedTicketId)?.name ?? "Customer"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Support Ticket #{selectedTicketId.substring(0, 8)} - {activeTicketTab.toUpperCase()}
                    </p>
                  </div>
                </div>
                
                {/* Ticket Actions */}
                <div className="flex space-x-2">
                  {activeTicketTab === "open" ? (
                    <button
                      onClick={handleCloseTicket}
                      className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                    >
                      Close Ticket
                    </button>
                  ) : (
                    <button
                      onClick={handleReopenTicket}
                      className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                      Reopen Ticket
                    </button>
                  )}
                  <button className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500" title="View Details">
                    <FiEdit size={20} />
                  </button>
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
    </NavbarSidebarLayout>
  );
};

export default SupportPage;
