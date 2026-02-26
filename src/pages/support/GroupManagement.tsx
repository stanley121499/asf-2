import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { useUserContext } from "../../context/UserContext";

// Types for the group management
export interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "admin" | "member";
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  members: GroupMember[];
  createdAt: string;
  type: "group" | "community";
  createdBy: string;
}

interface GroupManagementProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  onCreateGroup: (group: Omit<Group, "id" | "createdAt">) => void;
  onUpdateGroup: (group: Group) => void;
  onDeleteGroup: (groupId: string) => void;
  initialGroup?: Group | null; // Pass an existing group to edit
}

const GroupManagement: React.FC<GroupManagementProps> = ({
  isOpen,
  onClose,
  groups,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  initialGroup = null
}) => {
  const { users } = useUserContext();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(initialGroup);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<GroupMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Update form when initialGroup changes
  useEffect(() => {
    if (initialGroup) {
      setSelectedGroup(initialGroup);
      setGroupName(initialGroup.name);
      setGroupDescription(initialGroup.description || "");
      setSelectedMembers(initialGroup.members);
    } else {
      resetForm();
    }
  }, [initialGroup, isOpen]);

  // Reset form
  const resetForm = () => {
    setSelectedGroup(null);
    setGroupName("");
    setGroupDescription("");
    setSelectedMembers([]);
    setSearchTerm("");
  };

  // Handle group creation
  const handleCreateGroup = () => {
    if (!groupName.trim()) return;
    
    const newGroup = {
      name: groupName,
      description: groupDescription,
      avatar: "/images/users/default-avatar.png",
      members: selectedMembers,
      type: "group" as const,
      createdBy: "current-user-id", // This would come from auth context in a real implementation
    };
    
    onCreateGroup(newGroup);
    onClose();
  };

  // Handle group update
  const handleUpdateGroup = () => {
    if (!selectedGroup || !groupName.trim()) return;
    
    const updatedGroup: Group = {
      ...selectedGroup,
      name: groupName,
      description: groupDescription,
      members: selectedMembers,
    };
    
    onUpdateGroup(updatedGroup);
    onClose();
  };

  // Handle user selection
  const handleSelectUser = (user: any) => {
    if (selectedMembers.some(member => member.id === user.id)) return;
    
    const newMember: GroupMember = {
      id: user.id,
      name: user.email,
      email: user.email,
      avatar: "/images/users/default-avatar.png",
      role: "member",
    };
    
    setSelectedMembers([...selectedMembers, newMember]);
  };

  // Handle member removal
  const handleRemoveMember = (memberId: string) => {
    setSelectedMembers(selectedMembers.filter(member => member.id !== memberId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xl">
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {selectedGroup ? "Edit Group" : "Create New Group"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {/* Group Name */}
            <div>
              <label htmlFor="group-name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Name
              </label>
              <input
                type="text"
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Enter group name"
                required
              />
            </div>

            {/* Group Description */}
            <div>
              <label htmlFor="group-description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Description
              </label>
              <textarea
                id="group-description"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Enter group description"
              />
            </div>

            {/* Member Selection */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Add Members
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Search users..."
                />
                {searchTerm && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg max-h-60 overflow-auto">
                    {users
                      .filter(user => 
                        user.email.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map(user => (
                        <div
                          key={user.id}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center space-x-2"
                          onClick={() => handleSelectUser(user)}>
                          <img
                            src="/images/users/default-avatar.png"
                            alt={user.email}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.email}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.user_detail?.role || "User"}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Members List */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Selected Members ({selectedMembers.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map(member => (
                  <div
                    key={member.id}
                    className="bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 flex items-center space-x-2">
                    <img
                      src={member.avatar || "/images/users/default-avatar.png"}
                      alt={member.name}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-sm text-gray-800 dark:text-gray-200">{member.name}</span>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400">
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                Cancel
              </button>
              {selectedGroup ? (
                <>
                  <button
                    type="button"
                    onClick={handleUpdateGroup}
                    disabled={!groupName.trim() || selectedMembers.length === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed">
                    Update Group
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedGroup) {
                        onDeleteGroup(selectedGroup.id);
                        onClose();
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-800">
                    Delete
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || selectedMembers.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed">
                  Create Group
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupManagement; 