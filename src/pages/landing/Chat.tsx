import React, { useState, useEffect } from "react";
import { IoChevronBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { Conversation, useConversationContext } from "../../context/ConversationContext";
import { useAuthContext } from "../../context/AuthContext";
import LoadingPage from "../pages/loading";
import { useTicketContext } from "../../context/TicketContext";
import { useRef } from "react";
import ChatWindow from "../support/chat-window";
import { Button, TextInput, Textarea, Select } from "flowbite-react";
import TicketRatingModal from "../../components/TicketRatingModal";

/**
 * Form for collecting ticket details before starting chat
 */
interface TicketFormProps {
  formData: {
    subject: string;
    description: string;
    type: string;
  };
  onChange: (data: { subject: string; description: string; type: string }) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
}

const TicketForm: React.FC<TicketFormProps> = ({ formData, onChange, onSubmit, onCancel, loading }) => {
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    onChange({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.subject.trim() && formData.description.trim()) {
      onSubmit();
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Start a Support Request
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Please provide some details about your issue to help us assist you better.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type of Issue
            </label>
            <Select
              id="type"
              value={formData.type}
              onChange={(e) => handleInputChange("type", e.target.value)}
              required
            >
              <option value="general">General Inquiry</option>
              <option value="technical">Technical Issue</option>
              <option value="billing">Billing Question</option>
              <option value="feature">Feature Request</option>
              <option value="bug">Bug Report</option>
              <option value="account">Account Issue</option>
            </Select>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <TextInput
              id="subject"
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange("subject", e.target.value)}
              placeholder="Brief description of your issue"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Please provide more details about your issue..."
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading || !formData.subject.trim() || !formData.description.trim()}>
              {loading ? "Starting Chat..." : "Start Chat"}
            </Button>
            <Button color="gray" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LandingSupportChat: React.FC = () => {
  const {
    loading,
    conversations,
    createConversation,
    addParticipant,
    listMessagesByConversationId,
  } = useConversationContext();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [showTicketForm, setShowTicketForm] = useState<boolean>(false);
  const [ticketFormData, setTicketFormData] = useState({
    subject: "",
    description: "",
    type: "general" as string,
  });
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [closedTicketForRating, setClosedTicketForRating] = useState<{
    id: string;
    subject: string;
  } | null>(null);
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { createTicket, tickets, loading: ticketsLoading } = useTicketContext();
  const creatingRef = useRef<boolean>(false);

  // Poll as a fail-safe to keep messages fresh if realtime misses
  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(async () => {
      await listMessagesByConversationId(conversationId);
    }, 3000);
    return () => clearInterval(interval);
  }, [conversationId, listMessagesByConversationId]);

  // Always pick the freshest conversation reference to ensure instant UI updates
  useEffect(() => {
    if (!conversationId) {
      setActiveConversation(null);
      return;
    }
    const latest = conversations.find((c) => c.id === conversationId) ?? null;
    setActiveConversation(latest);
  }, [conversationId, conversations]);

  useEffect(() => {
    if (!user || loading || ticketsLoading) {
      console.log("[Chat] Waiting for data", { hasUser: !!user, loading, ticketsLoading });
      return;
    }
    if (creatingRef.current) return;

    // Prefer existing open ticket for this user
    const openTicket = tickets.find((t) => t.user_id === user.id && t.status !== "closed");
    console.log("[Chat] Open ticket lookup", { openTicket, ticketsCount: tickets.length });

    // Find conversation strictly by the open ticket id first
    const convByOpenTicket = openTicket
      ? conversations.find((c) => c.type === "support" && c.ticket_id === openTicket.id)
      : undefined;

    // Otherwise, find a participant conversation that is not tied to a closed ticket
    const participantSupportConvs = conversations.filter(
      (c) => c.type === "support" && c.participants.some((p) => p.user_id === user.id)
    );
    const participantOpenConv = participantSupportConvs.find((c) => {
      if (!c.ticket_id) return true;
      const t = tickets.find((tk) => tk.id === c.ticket_id);
      return t ? t.status !== "closed" : true;
    });

    const existing = convByOpenTicket ?? participantOpenConv;
    if (existing) {
      console.log("[Chat] Using existing support conversation", { conversationId: existing.id, ticketId: existing.ticket_id, messages: existing.messages?.length ?? 0 });
      setConversationId(existing.id);
      setShowTicketForm(false);
      return;
    }

    // If we have an open ticket without required details, show the form to complete it
    if (openTicket && (!openTicket.subject || !openTicket.description)) {
      setShowTicketForm(true);
      return;
    }

    // If no existing ticket, show the form for new ticket
    if (!openTicket) {
      setShowTicketForm(true);
      return;
    }
  }, [tickets, ticketsLoading, conversations, createConversation, addParticipant, loading, user, createTicket]);

  // Monitor ticket status changes to show rating modal when closed
  useEffect(() => {
    if (!user || !activeConversation?.ticket_id) return;

    const currentTicket = tickets.find(t => t.id === activeConversation.ticket_id);
    if (currentTicket && currentTicket.status === "closed" && !currentTicket.rating) {
      // Only show rating modal if ticket is closed and hasn't been rated yet
      setClosedTicketForRating({
        id: currentTicket.id,
        subject: currentTicket.subject || "Support Request"
      });
      setShowRatingModal(true);
    }
  }, [tickets, activeConversation, user]);

  /**
   * Handle ticket form submission
   */
  const handleTicketFormSubmit = async () => {
    if (!user || !ticketFormData.subject.trim() || !ticketFormData.description.trim() || creatingRef.current) {
      return;
    }

    creatingRef.current = true;
    try {
      // Create the ticket with form data
      const ticket = await createTicket({ 
        user_id: user.id, 
        status: "open",
        subject: ticketFormData.subject.trim(),
        description: ticketFormData.description.trim(),
        type: ticketFormData.type,
        priority: "medium" // Default priority
      });

      if (!ticket?.id) {
        console.error("Failed to create ticket");
        return;
      }

      // Create conversation for the ticket
      const created = await createConversation({ 
        type: "support", 
        active: true, 
        ticket_id: ticket.id 
      });

      if (!created?.id) {
        console.error("Failed to create conversation");
        return;
      }

      // Add user as participant
      await addParticipant({ 
        conversation_id: created.id, 
        user_id: user.id 
      });

      console.log("[Chat] Created support conversation", { 
        conversationId: created.id, 
        ticketId: ticket.id 
      });
      
      setConversationId(created.id);
      setShowTicketForm(false);
    } catch (error) {
      console.error("Error creating ticket and conversation:", error);
    } finally {
      creatingRef.current = false;
    }
  };

  // Optional diagnostics removed for cleaner UI

  if (!user || loading) {
    return <LoadingPage />;
  }

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

      {/* Messages + Input handled by shared ChatWindow to match internal/support UI */}
      <div className="flex-grow min-h-0">
        {showTicketForm ? (
          <TicketForm 
            formData={ticketFormData}
            onChange={setTicketFormData}
            onSubmit={handleTicketFormSubmit}
            onCancel={() => navigate(-1)}
            loading={creatingRef.current}
          />
        ) : activeConversation ? (
          <ChatWindow conversation={activeConversation} messages={activeConversation.messages} />
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Starting chat...</div>
        )}
      </div>

      {/* Ticket Rating Modal */}
      {closedTicketForRating && (
        <TicketRatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setClosedTicketForRating(null);
          }}
          ticketId={closedTicketForRating.id}
          customerName={user?.email || "Customer"}
          ticketSubject={closedTicketForRating.subject}
        />
      )}
    </div>
  );
};
export default LandingSupportChat;
