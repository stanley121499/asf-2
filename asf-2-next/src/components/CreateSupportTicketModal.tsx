import React, { useState } from "react";
import { FiSearch, FiUser, FiX } from "react-icons/fi";
import { useUserContext } from "../context/UserContext";
import { useTicketContext } from "../context/TicketContext";
import { useConversationContext } from "../context/ConversationContext";
import { useAuthContext } from "../context/AuthContext";

interface CreateSupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated?: (ticketId: string) => void;
}

const CreateSupportTicketModal: React.FC<CreateSupportTicketModalProps> = ({
  isOpen,
  onClose,
  onTicketCreated,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("general");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isCreating, setIsCreating] = useState(false);

  const { users } = useUserContext();
  const { createTicket } = useTicketContext();
  const { createConversation, addParticipant, createMessage } = useConversationContext();
  const { user: currentUser } = useAuthContext();

  // Filter users based on search term
  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = users.find((user) => user.id === selectedUserId);

  const handleCreateTicket = async () => {
    if (!selectedUserId || !currentUser || !subject.trim() || !description.trim()) {
      return;
    }

    setIsCreating(true);

    try {
      // Create the ticket
      const ticket = await createTicket({
        user_id: selectedUserId,
        status: "open",
        priority,
        subject: subject.trim(),
        description: description.trim(),
        type,
        created_at: new Date().toISOString(),
      });

      if (!ticket) {
        throw new Error("Failed to create ticket");
      }

      // Create a conversation for the ticket
      const conversation = await createConversation({
        type: "support",
        active: true,
        ticket_id: ticket.id,
        created_at: new Date().toISOString(),
      });

      if (!conversation) {
        throw new Error("Failed to create conversation");
      }

      // Add participants (customer and support agent)
      await Promise.all([
        addParticipant({
          conversation_id: conversation.id,
          user_id: selectedUserId,
        }),
        addParticipant({
          conversation_id: conversation.id,
          user_id: currentUser.id,
        }),
      ]);

      // Create an initial message with the ticket details
      const ticketContent = `New support ticket created.\n\nSubject: ${subject}\nType: ${type.charAt(0).toUpperCase() + type.slice(1)}\nPriority: ${priority.toUpperCase()}\n\n${description}`;
      
      await createMessage({
        conversation_id: conversation.id,
        content: ticketContent,
        created_at: new Date().toISOString(),
        user_id: currentUser.id,
        type: "text",
      });

      // Reset form
      setSelectedUserId(null);
      setSearchTerm("");
      setSubject("");
      setDescription("");
      setType("general");
      setPriority("medium");

      // Notify parent and close modal
      onTicketCreated?.(ticket.id);
      onClose();
    } catch (error) {
      console.error("Error creating support ticket:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const resolveUserAvatar = (userId: string): string | null => {
    const user = users.find((u) => u.id === userId);
    const detail = (user?.user_detail ?? {}) as Record<string, unknown>;
    const candidates = [
      detail["avatar_url"],
      detail["media_url"],
      detail["photo_url"],
      detail["image_url"],
      detail["profile_image"],
      detail["profile_picture"],
      detail["avatar"],
    ];
    const url = candidates.find(
      (v) => typeof v === "string" && (v as string).trim().length > 0
    );
    return typeof url === "string" ? url : null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-gray-900 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Support Ticket
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* User Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Select Customer
            </label>
            
            {!selectedUserId ? (
              <>
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400" size={20} />
                  </div>
                  <input
                    type="text"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    placeholder="Search customers by email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => {
                      const avatar = resolveUserAvatar(user.id);
                      return (
                        <div
                          key={user.id}
                          onClick={() => setSelectedUserId(user.id)}
                          className="flex items-center p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={user.email}
                              className="w-10 h-10 rounded-full mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mr-3 flex items-center justify-center">
                              <FiUser className="text-white" size={20} />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.email}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {(user.user_detail as any)?.role || "Customer"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      {searchTerm
                        ? "No customers found. Try a different search term."
                        : "Start typing to search for customers..."}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                {resolveUserAvatar(selectedUserId) ? (
                  <img
                    src={resolveUserAvatar(selectedUserId)!}
                    alt={selectedUser?.email}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mr-4 flex items-center justify-center">
                    <FiUser className="text-white" size={24} />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedUser?.email}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(selectedUser?.user_detail as any)?.role || "Customer"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Ticket Details */}
          {selectedUserId && (
            <>
              {/* Type */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Type of Issue
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                >
                  <option value="general">General Inquiry</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing Question</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Bug Report</option>
                  <option value="account">Account Issue</option>
                </select>
              </div>

              {/* Subject */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Please provide detailed information about the issue..."
                  required
                />
              </div>

              {/* Priority */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <div className="flex space-x-3">
                  {(["low", "medium", "high"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setPriority(level)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        priority === level
                          ? level === "high"
                            ? "bg-red-100 text-red-700 border-2 border-red-500 dark:bg-red-900/30 dark:text-red-400 dark:border-red-600"
                            : level === "medium"
                            ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-500 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-600"
                            : "bg-green-100 text-green-700 border-2 border-green-500 dark:bg-green-900/30 dark:text-green-400 dark:border-green-600"
                          : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateTicket}
            disabled={!selectedUserId || !subject.trim() || !description.trim() || isCreating}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateSupportTicketModal;
