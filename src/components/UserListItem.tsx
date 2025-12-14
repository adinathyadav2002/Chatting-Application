import React from "react";
import type { User } from "../types/user";
import Avatar from "./Avatar";

interface UserListItemProps {
  user: User;
  currentUserId: string | number;
  onUserClick: (user: User) => void;
  hasUnreadMessages?: boolean;
}

const UserListItem: React.FC<UserListItemProps> = ({
  user,
  currentUserId,
  onUserClick,
  hasUnreadMessages = false,
}) => {
  const isCurrentUser = user.id.toString() === currentUserId.toString();

  return (
    <div
      onClick={() => !isCurrentUser && onUserClick(user)}
      className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 relative ${isCurrentUser
          ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-md cursor-default"
          : "bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50 hover:translate-x-1 hover:shadow-md cursor-pointer"
        } ${!user.isOnline ? "opacity-60 grayscale" : ""}`}
    >
      {" "}
      {/* Avatar */}
      <div className="relative">
        <Avatar
          type="user"
          name={user.name}
          size="md"
          isOnline={user.isOnline}
          className="shadow-sm"
        />
      </div>
      {/* User Info */}
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-gray-800 truncate block">
          {user.name}
          {isCurrentUser && (
            <span className="text-xs text-blue-600 ml-1">(You)</span>
          )}
        </span>
        <span className="text-xs text-gray-500">
          {user.isOnline ? "Online" : "Offline"}
        </span>
      </div>
      {/* Message Icon for non-current users */}
      {!isCurrentUser && (
        <div className="flex items-center gap-2">
          {hasUnreadMessages && (
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
          <span className="text-gray-400 hover:text-blue-500 transition-colors">
            💬
          </span>
        </div>
      )}
    </div>
  );
};

export default UserListItem;
