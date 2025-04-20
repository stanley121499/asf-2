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
import { 
  FiHeadphones, 
  FiSearch, 
  FiPlus, 
  FiEdit,
  FiCheckCircle 
} from "react-icons/fi";
import ChatWindow from "./chat-window";
import { v4 as uuidv4 } from "uuid";

// Define types for our messaging system
type SupportTicketStatus = "open" | "closed";

interface SupportTicket {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  avatar?: string;
  status: SupportTicketStatus;
}

const SupportPage: React.FC = function () {
  const { conversations, loading } = useConversationContext();
  const { users } = useUserContext();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
  // Navigation state
  const [activeTicketTab, setActiveTicketTab] = useState<SupportTicketStatus>("open");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sample support tickets based on the existing conversations
  const supportTickets = conversations.map(conv => ({
    id: conv.id,
    name: users.find(user => user.id === conv.customer_id)?.email || "Unknown User",
    lastMessage: conv.messages[0]?.content || "No messages",
    timestamp: conv.created_at ? new Date(conv.created_at).toLocaleString() : "Unknown time",
    unreadCount: 0,
    status: Math.random() > 0.5 ? "open" : "closed" as SupportTicketStatus, // Randomly assign status for demo
    avatar: "/images/users/default-avatar.png",
  }));
  
  // Mock data for additional tickets (for testing UI)
  const [mockTickets, setMockTickets] = useState<SupportTicket[]>([
    {
      id: `support-${Date.now() - 100000}`,
      name: "Jane Smith",
      lastMessage: "When will my order arrive?",
      timestamp: "2 hours ago",
      unreadCount: 2,
      status: "open",
      avatar: "/images/users/default-avatar.png"
    },
    {
      id: `support-${Date.now() - 200000}`,
      name: "Mike Johnson",
      lastMessage: "Thanks for your help!",
      timestamp: "Yesterday",
      unreadCount: 0,
      status: "closed",
      avatar: "/images/users/default-avatar.png"
    }
  ]);
  
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  
  // Function to create a support ticket
  const handleCreateSupportTicket = () => {
    // In a real implementation, this would create a new support ticket
    const newTicket: SupportTicket = {
      id: `support-${Date.now()}`,
      name: "New Support Ticket",
      lastMessage: "Ticket created - awaiting response",
      timestamp: new Date().toISOString(),
      unreadCount: 0,
      status: "open",
      avatar: "/images/users/default-avatar.png"
    };
    
    setMockTickets(prev => [...prev, newTicket]);
    setSelectedTicket(newTicket);
    setActiveTicketTab("open");
  };

  // Function to create a mock conversation object for tickets without actual conversations
  const createMockConversation = (ticketId: string): Conversation => {
    return {
      id: ticketId,
      customer_id: "mock-customer",
      status: "active",
      created_at: new Date().toISOString(),
      messages: [
        {
          id: `system-${ticketId}`,
          conversation_id: ticketId,
          content: "Support ticket created. An agent will respond shortly.",
          created_at: new Date().toISOString(),
          direction: "system",
          media_url: "",
          sender: "System"
        }
      ]
    };
  };

  if (loading) {
    return <LoadingPage />;
  }

  // Filter tickets based on active tab and search query
  const filteredTickets = [...mockTickets, ...supportTickets].filter(ticket => {
    const matchesStatus = ticket.status === activeTicketTab;
    const matchesSearch = !searchQuery || 
                        ticket.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (ticket.lastMessage && ticket.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Calculate unread counts
  const unreadCounts = {
    open: [...mockTickets, ...supportTickets]
      .filter(ticket => ticket.status === "open" && ticket.unreadCount && ticket.unreadCount > 0)
      .reduce((sum, ticket) => sum + (ticket.unreadCount || 0), 0),
    closed: [...mockTickets, ...supportTickets]
      .filter(ticket => ticket.status === "closed" && ticket.unreadCount && ticket.unreadCount > 0)
      .reduce((sum, ticket) => sum + (ticket.unreadCount || 0), 0)
  };

  // Handle ticket selection
  const handleTicketSelect = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    
    // Find real conversation if it exists
    const supportConversation = conversations.find(conv => conv.id === ticket.id);
    if (supportConversation) {
      setSelectedConversation(supportConversation);
    } else {
      setSelectedConversation(null);
    }
  };
  
  // Function to close a ticket
  const handleCloseTicket = () => {
    if (!selectedTicket) return;
    
    // Update ticket status
    if (selectedTicket.status === "open") {
      const updatedTicket = {...selectedTicket, status: "closed" as SupportTicketStatus};
      
      // Update in mockTickets if it exists there
      const mockIndex = mockTickets.findIndex(t => t.id === selectedTicket.id);
      if (mockIndex >= 0) {
        const updatedMockTickets = [...mockTickets];
        updatedMockTickets[mockIndex] = updatedTicket;
        setMockTickets(updatedMockTickets);
      }
      
      setSelectedTicket(updatedTicket);
      // In a real app, you would also update the status in the backend
    }
  };
  
  // Function to reopen a ticket
  const handleReopenTicket = () => {
    if (!selectedTicket) return;
    
    // Update ticket status
    if (selectedTicket.status === "closed") {
      const updatedTicket = {...selectedTicket, status: "open" as SupportTicketStatus};
      
      // Update in mockTickets if it exists there
      const mockIndex = mockTickets.findIndex(t => t.id === selectedTicket.id);
      if (mockIndex >= 0) {
        const updatedMockTickets = [...mockTickets];
        updatedMockTickets[mockIndex] = updatedTicket;
        setMockTickets(updatedMockTickets);
      }
      
      setSelectedTicket(updatedTicket);
      // In a real app, you would also update the status in the backend
    }
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
                    selectedTicket?.id === ticket.id ? "bg-gray-50 dark:bg-gray-600" : ""
                  }`}
                  onClick={() => handleTicketSelect(ticket)}
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
          {selectedTicket ? (
            <div className="h-full flex flex-col">
              {/* Ticket Header */}
              <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="relative">
                    <img
                      className="w-10 h-10 rounded-full mr-3"
                      src={selectedTicket.avatar || "/images/users/default-avatar.png"}
                      alt={selectedTicket.name}
                    />
                    {selectedTicket.status === "open" && (
                      <div className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-1">
                        <FiHeadphones size={10} className="text-white" />
                      </div>
                    )}
                    {selectedTicket.status === "closed" && (
                      <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1">
                        <FiCheckCircle size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedTicket.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Support Ticket #{selectedTicket.id.substring(0, 8)} - {selectedTicket.status.toUpperCase()}
                    </p>
                  </div>
                </div>
                
                {/* Ticket Actions */}
                <div className="flex space-x-2">
                  {selectedTicket.status === "open" ? (
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
                  conversation={createMockConversation(selectedTicket.id)}
                  messages={createMockConversation(selectedTicket.id).messages}
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
