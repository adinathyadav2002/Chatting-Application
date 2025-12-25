import React, { useEffect, useRef } from "react";
import type { Message } from "../types";
import { Divide } from "lucide-react";

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
      className="flex-1 overflow-y-auto p-6 bg-linear-to-b from-black via-gray-900 to-black"
    >
      {messages.length === 0 ? (
        /* EMPTY STATE */
        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
          <Divide size={40} className="mb-4 opacity-40" />
          <p className="text-base tracking-wide">
            No messages yet
          </p>
          <p className="text-base text-gray-500 mt-1">
            Start the conversation ✨
          </p>
        </div>
      ) : (
        <div className="space-y-4">
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
                    ? "bg-linear-to-r from-white to-gray-200 text-black rounded-br-md"
                    : "bg-linear-to-br from-gray-800 to-gray-900 text-white rounded-bl-md border border-white/10"
                    }`}
                >
                  <div className="text-sm leading-relaxed">
                    {message?.content}
                  </div>

                  <div
                    className={`text-xs absolute right-1 bottom-0.5 ${isOwnMessage ? "text-gray-600" : "text-gray-400"
                      }`}
                  >
                    {formatTime(message?.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );

};

export default MessageList;