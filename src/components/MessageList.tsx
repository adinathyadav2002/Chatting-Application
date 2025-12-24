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
      className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-black via-gray-900 to-black"
    >
      {messages.map((message) => {
        const isOwnMessage =
          message?.userId.toString() === currentUserId?.toString();
        return (
          <div
            key={message?.id}
            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"
              }`}
          >
            <div
              className={`max-w-xs relative lg:max-w-md min-w-24 pr-5 pl-3 py-1 pb-4 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl ${isOwnMessage
                ? "bg-gradient-to-r from-white to-gray-200 text-black rounded-br-md"
                : "bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-bl-md border border-white/10"
                }`}
            >
              <div className="text-sm leading-relaxed">{message?.content}</div>
              <div className="flex flex-row">
                <div
                  className={`text-xs z-5 absolute  right-1 bottom-0.5  ${isOwnMessage ? "text-gray-600" : "text-gray-400"
                    }`}
                >
                  {formatTime(message?.timestamp)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;