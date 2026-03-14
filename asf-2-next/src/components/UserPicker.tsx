"use client";
import React, { useState, useMemo } from "react";
import { useUserContext } from "@/context/UserContext";

interface UserPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string, userName: string) => void;
  excludeUserIds?: string[];
}

const UserPicker: React.FC<UserPickerProps> = ({ isOpen, onClose, onSelectUser, excludeUserIds = [] }) => {
  const { users } = useUserContext();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    users.filter(u =>
      !excludeUserIds.includes(u.id ?? "") &&
      (u.email ?? "").toLowerCase().includes(search.toLowerCase())
    ),
    [users, excludeUserIds, search]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select User</h2>
        <input
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 mb-4 text-sm dark:bg-gray-700 dark:text-white"
          placeholder="Search by email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
        <div className="max-h-64 overflow-y-auto space-y-1">
          {filtered.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No users found</p>
          )}
          {filtered.map(u => (
            <button
              key={u.id}
              className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm text-gray-900 dark:text-white"
              onClick={() => { onSelectUser(u.id ?? "", u.email ?? ""); onClose(); }}
            >
              {u.email}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">Cancel</button>
      </div>
    </div>
  );
};

export default UserPicker;
