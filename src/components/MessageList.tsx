import React, { useEffect, useRef } from "react";
import type { Message } from "../types";
import { Check, CheckCheck, Clock, Divide } from "lucide-react";
import { useSocket } from "../hooks/useSocket";
import { useParams } from "react-router-dom";

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

  const { anotherUserId } = useParams();

  const { socket } = useSocket();

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  const isAtBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return false;

    // small threshold for safety (mobile / zoom)
    return el.scrollHeight - el.scrollTop - el.clientHeight < 10;
  };

  const emitReadAll = () => {
    socket?.emit("read all messages", currentUserId, Number(anotherUserId));
  };

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (isAtBottom()) {
        emitReadAll();
      }
    };

    el.addEventListener("scroll", handleScroll);

    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, [messages]);



  useEffect(() => {
    scrollToBottom();
  }, []);

  const formatTime = (timestamp: Date) => {
    return timestamp?.toLocaleTimeString([], {
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
            const isOwnMessage = message?.sender?.id === currentUserId;
            return (
              <div
                key={message?.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs relative lg:max-w-md min-w-24 pr-5 pl-3 py-1 pb-4 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl ${isOwnMessage
                    ? "bg-linear-to-r from-white to-gray-200 text-black rounded-br-md"
                    : "bg-linear-to-br from-gray-800 to-gray-900 text-white rounded-bl-md border border-white/10"
                    }`}
                >
                  {anotherUserId === "0" && <div className="text-sm leading-relaxed">
                    {message?.sender.name}
                  </div>}
                  <div className="text-sm leading-relaxed">
                    {message?.content}
                  </div>

                  <div
                    className={`text-xs absolute right-1 bottom-0.5 flex items-center gap-1 ${isOwnMessage ? "text-gray-600" : "text-gray-400"
                      }`}
                  >
                    {formatTime(message?.createdAt)}

                    {isOwnMessage && message.isRead === "not-send" && (
                      <Clock size={12} className="text-gray-400 animate-pulse" />
                    )}

                    {isOwnMessage && message.isRead === "send" && (
                      <Check size={12} className="text-gray-400" />
                    )}

                    {isOwnMessage && message.isRead === "read" && (
                      <CheckCheck size={12} className="text-blue-500" />
                    )}
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