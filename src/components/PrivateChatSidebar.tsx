import React from "react";
import Avatar from "./Avatar";
import type { User } from "../types/user";

interface Conversation {
  user: User;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

interface PrivateChatSidebarProps {
  isVisible: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  onConversationClick: (user: User) => void;
  onStartNewChat: () => void;
}

const PrivateChatSidebar: React.FC<PrivateChatSidebarProps> = ({
  isVisible,
  onToggle,
  conversations,
  onConversationClick,
  onStartNewChat,
}) => {
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <div
      className={`fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 z-40 ${isVisible ? "translate-x-0" : "translate-x-full"
        }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Private Chats</h2>
            <p className="text-sm text-purple-100 mt-1">
              {conversations.length} conversations
            </p>
          </div>
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <span className="text-xl">×</span>
          </button>
        </div>

        {/* Start New Chat Button */}
        <button
          onClick={onStartNewChat}
          className="w-full mt-4 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>💬</span>
          <span className="text-sm font-medium">Start New Chat</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💭</span>
            </div>
            <h3 className="font-medium text-gray-800 mb-2">
              No conversations yet
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Start a conversation by clicking on a user from the user list
            </p>
            <button
              onClick={onStartNewChat}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              Browse Users
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.user.id}
                onClick={() => onConversationClick(conversation.user)}
                className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-md border border-transparent hover:border-blue-100"
              >
                {" "}
                {/* Avatar */}
                <Avatar
                  type="user"
                  name={conversation.user.name}
                  size="lg"
                  isOnline={conversation.user.isOnline}
                  className="shadow-sm"
                />
                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-800 truncate">
                      {conversation.user.name}
                    </h4>
                    {conversation.lastMessageTime && (
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessageTime)}
                      </span>
                    )}
                  </div>

                  {conversation.lastMessage ? (
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      No messages yet
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">
                      {conversation.user.isOnline ? "Online" : "Offline"}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center">
                        {conversation.unreadCount > 99
                          ? "99+"
                          : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Total unread:{" "}
            {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivateChatSidebar;
