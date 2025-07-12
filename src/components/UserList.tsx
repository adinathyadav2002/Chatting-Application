import React from "react";
import type { User } from "../types";

interface UserListProps {
  users: User[];
  currentUserId: string;
}

const UserList: React.FC<UserListProps> = ({ users, currentUserId }) => {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl p-5 h-full overflow-y-auto shadow-inner">
      <h3 className="text-lg font-bold text-gray-800 border-b-2 border-blue-200 pb-3 mb-5">
        Online Users ({users.filter((u) => u.isOnline).length})
      </h3>
      <div className="flex flex-col gap-3">
        {users.map((user) => (
          <div
            key={user.id}
            className={`flex items-center gap-3 p-4 rounded-xl bg-white border transition-all duration-300 hover:bg-blue-50 hover:translate-x-1 hover:shadow-md cursor-pointer ${
              user.id === currentUserId
                ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-md"
                : "border-gray-200 hover:border-blue-200"
            } ${!user.isOnline ? "opacity-60 grayscale" : ""}`}
          >
            <span className="text-2xl w-10 h-10 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-full shadow-sm">
              {user.avatar}
            </span>
            <span className="flex-1 font-semibold text-gray-800">
              {user.username}
            </span>
            <span
              className={`text-sm transition-all duration-200 ${
                user.isOnline ? "animate-pulse" : ""
              }`}
            >
              {user.isOnline ? "🟢" : "⚫"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;
