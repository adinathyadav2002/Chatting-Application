import React, { useEffect, useRef } from "react";
import type { Message } from "../types";

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white"
    >
      {" "}
      {messages.map((message) => {
        const isOwnMessage =
          message?.userId.toString() === currentUserId?.toString();
        return (
          <div
            key={message?.id}
            className={`flex ${
              isOwnMessage ? "justify-end" : "justify-start"
            } animate-fadeIn`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                isOwnMessage
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                  : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
              }`}
            >
              {!isOwnMessage && (
                <div className="text-xs font-semibold mb-1 text-blue-600">
                  {message?.username}
                </div>
              )}
              <div className="text-sm leading-relaxed">{message?.content}</div>
              <div
                className={`text-xs mt-2 ${
                  isOwnMessage ? "text-blue-100" : "text-gray-400"
                }`}
              >
                {formatTime(message?.timestamp)}
              </div>
            </div>{" "}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
