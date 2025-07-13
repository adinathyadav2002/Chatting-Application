import React, { useState } from "react";
import type { User } from "../types";

interface UserSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUserId: string;
  onUserSelect: (user: User) => void;
  existingConversations: User[];
}

const UserSelector: React.FC<UserSelectorProps> = ({
  isOpen,
  onClose,
  users,
  currentUserId,
  onUserSelect,
  existingConversations,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter out current user and users with existing conversations
  const availableUsers = users.filter((user) => {
    const isNotCurrentUser = user.id.toString() !== currentUserId;
    const noExistingConversation = !existingConversations.some(
      (c) => c.id === user.id
    );
    const matchesSearch = user.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return isNotCurrentUser && noExistingConversation && matchesSearch;
  });

  const handleUserSelect = (user: User) => {
    onUserSelect(user);
    onClose();
    setSearchTerm("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Start New Chat</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <span className="text-xl">×</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 placeholder-blue-100 text-white border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4">
          {availableUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? (
                <>
                  <span className="text-2xl block mb-2">🔍</span>
                  <p>No users found matching "{searchTerm}"</p>
                </>
              ) : (
                <>
                  <span className="text-2xl block mb-2">💬</span>
                  <p>All users already have conversations</p>
                  <p className="text-sm text-gray-400 mt-1">
                    or are currently offline
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                Select a user to start chatting ({availableUsers.length}{" "}
                available)
              </p>
              {availableUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 cursor-pointer transition-all duration-200 hover:shadow-sm border border-transparent hover:border-blue-200"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <span className="text-xl w-10 h-10 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-full">
                      {user.avatar || "👤"}
                    </span>
                    {user.isOnline && (
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white animate-pulse" />
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{user.name}</h4>
                    <p className="text-sm text-gray-500">
                      {user.isOnline ? "Online" : "Offline"}
                    </p>
                  </div>

                  {/* Message Icon */}
                  <div className="text-blue-500">
                    <span>💬</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-500 text-center">
            Click on a user to start a private conversation
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserSelector;
