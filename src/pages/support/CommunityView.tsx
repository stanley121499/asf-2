import React, { useState, useEffect } from "react";
import { FiPlus, FiX, FiTrash2 } from "react-icons/fi";
import { HiOutlineUserGroup } from "react-icons/hi";
import { Group, GroupMember } from "./GroupManagement";
import { useUserContext } from "../../context/UserContext";

interface CommunityViewProps {
  isOpen: boolean;
  onClose: () => void;
  communities: Group[];
  groups: Group[];
  onCreateCommunity: (community: Omit<Group, "id" | "createdAt">) => void;
  onUpdateCommunity: (community: Group) => void;
  onDeleteCommunity: (communityId: string) => void;
  onCreateGroup: (group: Omit<Group, "id" | "createdAt">) => void;
  onUpdateGroup: (group: Group) => void;
  onDeleteGroup: (groupId: string) => void;
  communityToEdit: Group | null;
}

const CommunityView: React.FC<CommunityViewProps> = ({
  isOpen,
  onClose,
  communities,
  groups,
  onCreateCommunity,
  onUpdateCommunity,
  onDeleteCommunity,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  communityToEdit
}) => {
  const { users } = useUserContext();
  const [communityName, setCommunityName] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<GroupMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateMode, setIsCreateMode] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState<Group | null>(null);
  const [showGroups, setShowGroups] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Update form when communityToEdit changes
  useEffect(() => {
    if (communityToEdit) {
      setSelectedCommunity(communityToEdit);
      setCommunityName(communityToEdit.name);
      setCommunityDescription(communityToEdit.description || "");
      setSelectedMembers(communityToEdit.members);
      setIsCreateMode(false);
      setShowGroups(true); // Show groups when editing community
    } else {
      resetForm();
      setIsCreateMode(true);
      setShowGroups(false);
    }
  }, [communityToEdit, isOpen]);

  // Reset form
  const resetForm = () => {
    setSelectedCommunity(null);
    setCommunityName("");
    setCommunityDescription("");
    setSelectedMembers([]);
    setSearchTerm("");
    setNewGroupName("");
  };

  const handleCreateCommunity = () => {
    if (!communityName.trim()) return;

    const newCommunity = {
      name: communityName,
      description: communityDescription,
      avatar: "/images/users/community-avatar.png",
      members: selectedMembers,
      type: "community" as const,
      createdBy: "current-user-id"
    };

    onCreateCommunity(newCommunity);
    onClose();
  };

  const handleUpdateCommunity = () => {
    if (!selectedCommunity || !communityName.trim()) return;

    const updatedCommunity: Group = {
      ...selectedCommunity,
      name: communityName,
      description: communityDescription,
      members: selectedMembers
    };

    onUpdateCommunity(updatedCommunity);
    // Don't close the modal yet if we're showing groups
    if (!showGroups) {
      onClose();
    }
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

  // Find all groups that belong to this community
  const getCommunityGroups = () => {
    if (!selectedCommunity) return [];

    return groups.filter(group =>
      group.type === "group" &&
      group.name.startsWith(`${selectedCommunity.name} - `)
    );
  };

  // Create a new group in this community
  const handleCreateGroupInCommunity = () => {
    if (!selectedCommunity || !newGroupName.trim()) return;

    const newGroup = {
      name: `${selectedCommunity.name} - ${newGroupName}`,
      description: `Group in ${selectedCommunity.name} community`,
      avatar: "/images/users/group-avatar.png",
      members: [...selectedMembers], // Start with the same members as the community
      type: "group" as const,
      createdBy: "current-user-id"
    };

    onCreateGroup(newGroup);
    setNewGroupName("");
  };

  if (!isOpen) return null;

  const communityGroups = getCommunityGroups();

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xl">
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isCreateMode ? "Create New Community" : "Edit Community"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6">
          {!showGroups ? (
            <div className="space-y-4">
              {/* Community Name */}
              <div>
                <label htmlFor="community-name" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Community Name
                </label>
                <input
                  type="text"
                  id="community-name"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter community name"
                />
              </div>

              {/* Community Description */}
              <div>
                <label htmlFor="community-description" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  id="community-description"
                  value={communityDescription}
                  onChange={(e) => setCommunityDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter community description"
                />
              </div>

              {/* Member Selection */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Add Members
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                              loading="lazy"
                              decoding="async"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.email}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {user.user_detail?.role || "User"}
                              </p>
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
                        loading="lazy"
                        decoding="async"
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
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                {!isCreateMode ? (
                  <>
                    <button
                      onClick={() => {
                        handleUpdateCommunity();
                        setShowGroups(true);
                      }}
                      disabled={!communityName.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Update & Manage Groups
                    </button>
                    <button
                      onClick={() => {
                        if (selectedCommunity) {
                          onDeleteCommunity(selectedCommunity.id);
                          onClose();
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-800"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleCreateCommunity}
                    disabled={!communityName.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Community Info */}
              <div className="flex items-center mb-4">
                <img
                  src={selectedCommunity?.avatar || "/images/users/community-avatar.png"}
                  alt={selectedCommunity?.name || "Community"}
                  className="w-12 h-12 rounded-full mr-4"
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedCommunity?.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedCommunity?.description || `Community for ${selectedCommunity?.name}`}
                  </p>
                </div>
              </div>

              {/* Create Group Form */}
              <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Add a Group to this Community</h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Enter group name"
                  />
                  <button
                    onClick={handleCreateGroupInCommunity}
                    disabled={!newGroupName.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiPlus size={16} className="mr-1 inline" />
                    Add Group
                  </button>
                </div>
              </div>

              {/* Group List */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Groups in this Community</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {communityGroups.length > 0 ? (
                    communityGroups.map(group => (
                      <div key={group.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="relative flex-shrink-0">
                              <img
                                src={group.avatar || "/images/users/group-avatar.png"}
                                alt={group.name}
                                className="w-8 h-8 rounded-full"
                                loading="lazy"
                                decoding="async"
                              />
                              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                                <HiOutlineUserGroup size={10} className="text-white" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {group.name.replace(`${selectedCommunity?.name} - `, '')}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {group.members.length} members
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => onDeleteGroup(group.id)}
                              className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 p-1"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      No groups in this community yet. Add a group to get started.
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowGroups(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Back to Community Settings
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityView; 