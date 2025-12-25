import React, { useState } from "react";
import type { User } from "../types/user";
import PrivateMessageModal from "./PrivateMessageModal";
import PrivateChatSidebar from "./PrivateChatSidebar";
import UserSelector from "./UserSelector";

interface Conversation {
  user: User;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

interface PrivateMessagingInterfaceProps {
  users: User[];
  currentUserId: string;
  conversations: Conversation[];
  privateMessages: any;
  isConnected: boolean;
  onSendPrivateMessage: (
    content: string,
    targetUserId: string | number
  ) => void;
  onConversationUpdate: (conversations: Conversation[]) => void;
}

const PrivateMessagingInterface: React.FC<PrivateMessagingInterfaceProps> = ({
  users,
  currentUserId,
  conversations,
  privateMessages,
  isConnected,
  onSendPrivateMessage,
  onConversationUpdate,
}) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false);
  const [isPrivateModalOpen, setIsPrivateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const totalUnreadCount = conversations.reduce(
    (sum, c) => sum + c.unreadCount,
    0
  );

  const handleConversationClick = (user: User) => {
    setSelectedUser(user);
    setIsPrivateModalOpen(true);
    setIsSidebarVisible(false);

    // Mark messages as read
    const updatedConversations = conversations.map((c) =>
      c.user.id === user.id ? { ...c, unreadCount: 0 } : c
    );
    onConversationUpdate(updatedConversations);
  };

  const handleUserSelect = (user: User) => {
    // Check if conversation already exists
    const existingConversation = conversations.find(
      (c) => c.user.id === user.id
    );

    if (!existingConversation) {
      // Create new conversation
      const newConversation: Conversation = {
        user,
        unreadCount: 0,
      };
      onConversationUpdate([...conversations, newConversation]);
    }

    // Open chat with selected user
    setSelectedUser(user);
    setIsPrivateModalOpen(true);
  };

  const handleClosePrivateModal = () => {
    setIsPrivateModalOpen(false);
    setSelectedUser(null);
  };

  const handleStartNewChat = () => {
    setIsSidebarVisible(false);
    setIsUserSelectorOpen(true);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsSidebarVisible(!isSidebarVisible)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-linear-to-r from-purple-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-30 hover:scale-110"
      >
        <span className="text-xl">💬</span>
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse font-bold">
            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
          </span>
        )}
      </button>

      {/* Backdrop for sidebar */}
      {isSidebarVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-30"
          onClick={() => setIsSidebarVisible(false)}
        />
      )}

      {/* Private Chat Sidebar */}
      <PrivateChatSidebar
        isVisible={isSidebarVisible}
        onToggle={() => setIsSidebarVisible(!isSidebarVisible)}
        conversations={conversations}
        onConversationClick={handleConversationClick}
        onStartNewChat={handleStartNewChat}
      />

      {/* User Selector Modal */}
      <UserSelector
        isOpen={isUserSelectorOpen}
        onClose={() => setIsUserSelectorOpen(false)}
        users={users}
        currentUserId={currentUserId}
        onUserSelect={handleUserSelect}
        existingConversations={conversations.map((c) => c.user)}
      />

      {/* Private Message Modal */}
      <PrivateMessageModal
        isOpen={isPrivateModalOpen}
        onClose={handleClosePrivateModal}
        targetUser={selectedUser}
        currentUserId={currentUserId}
        messages={
          selectedUser ? privateMessages[selectedUser.id.toString()] || [] : []
        }
        onSendMessage={onSendPrivateMessage}
        isConnected={isConnected}
      />
    </>
  );
};

export default PrivateMessagingInterface;
