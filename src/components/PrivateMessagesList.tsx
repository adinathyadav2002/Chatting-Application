import React from "react";
import Avatar from "./Avatar";
import type { User } from "../types/user";

interface Conversation {
  user: User;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

interface PrivateMessagesListProps {
  conversations: Conversation[];
  onConversationClick: (user: User) => void;
  isVisible: boolean;
  onToggle: () => void;
}

const PrivateMessagesList: React.FC<PrivateMessagesListProps> = ({
  conversations,
  onConversationClick,
  isVisible,
  onToggle,
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
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40 hover:scale-110"
      >
        <span className="text-xl">💬</span>
        {conversations.some((c) => c.unreadCount > 0) && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
          </span>
        )}
      </button>

      {/* Conversations Panel */}
      {isVisible && (
        <div className="fixed bottom-24 right-6 w-80 max-h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-40 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Private Messages</h3>
              <button
                onClick={onToggle}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
              >
                <span className="text-sm">×</span>
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <span className="text-3xl block mb-2">💭</span>
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Click on a user to start chatting
                </p>
              </div>
            ) : (
              <div className="p-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.user.id}
                    onClick={() => onConversationClick(conversation.user)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {" "}
                    {/* Avatar */}
                    <Avatar
                      type="user"
                      name={conversation.user.name}
                      size="md"
                      isOnline={conversation.user.isOnline}
                    />
                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800 truncate">
                          {conversation.user.name}
                        </span>
                        {conversation.lastMessageTime && (
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessageTime)}
                          </span>
                        )}
                      </div>

                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-600 truncate mt-0.5">
                          {conversation.lastMessage}
                        </p>
                      )}
                    </div>
                    {/* Unread Count */}
                    {conversation.unreadCount > 0 && (
                      <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conversation.unreadCount > 9
                          ? "9+"
                          : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-30"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default PrivateMessagesList;
