import React, { useState } from "react";
import { FiSearch, FiUser } from "react-icons/fi";

export interface UserPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string, userName: string) => void;
  users: any[];
}

const UserPicker: React.FC<UserPickerProps> = ({ 
  isOpen, 
  onClose, 
  onSelectUser,
  users
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select User</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => onSelectUser(user.id, user.email)}
                  className="flex items-center p-3 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="relative mr-3">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.email}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          const el = e.currentTarget as HTMLImageElement;
                          el.style.display = "none";
                          el.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-500 dark:to-gray-600 ${user.avatar_url ? "hidden" : ""}`}>
                      <FiUser className="text-gray-700 dark:text-gray-200" size={20} />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(user.user_detail as any)?.role || "User"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No users found. Try a different search term.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPicker; 