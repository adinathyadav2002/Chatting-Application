import React, { useEffect, useRef } from "react";
import type { User, Message } from "../types";
import MessageInput from "./MessageInput";

interface PrivateMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User | null;
  currentUserId: string | number;
  messages: Message[];
  onSendMessage: (content: string, targetUserId: string | number) => void;
  isConnected: boolean;
}

const PrivateMessageModal: React.FC<PrivateMessageModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentUserId,
  messages,
  onSendMessage,
  isConnected,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content: string) => {
    if (targetUser) {
      onSendMessage(content, targetUser.id);
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen || !targetUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="text-2xl w-12 h-12 flex items-center justify-center bg-white bg-opacity-20 rounded-full">
                {targetUser.avatar || "👤"}
              </span>
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  targetUser.isOnline ? "bg-green-400" : "bg-gray-400"
                }`}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{targetUser.name}</h3>
              <p className="text-sm text-blue-100">
                {targetUser.isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <span className="text-xl">×</span>
          </button>
        </div>
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <span className="text-4xl mb-2">💬</span>
              <p>Start a conversation with {targetUser.name}</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage =
                message.userId.toString() === currentUserId.toString();

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 ${
                      isOwnMessage
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                        : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
                    }`}
                  >
                    <div className="text-sm leading-relaxed">
                      {message.content}
                    </div>
                    <div
                      className={`text-xs mt-2 ${
                        isOwnMessage ? "text-blue-100" : "text-gray-400"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>{" "}
        {/* Message Input */}
        <div className="border-t border-gray-200">
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={!isConnected || !targetUser.isOnline}
          />
          {!targetUser.isOnline && (
            <div className="px-6 py-2 text-xs text-gray-500 text-center bg-gray-50">
              {targetUser.name} is offline
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivateMessageModal;
