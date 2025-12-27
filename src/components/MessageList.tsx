import React, { useEffect, useRef, useState } from "react";
import type { Message } from "../types";
import { Check, CheckCheck, Clock, Divide, ArrowDown } from "lucide-react";
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
  const unreadDividerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const { anotherUserId } = useParams();
  const { socket } = useSocket();

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  const scrollToUnread = () => {
    if (unreadDividerRef.current) {
      unreadDividerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      scrollToBottom();
    }
  };

  const isAtBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return false;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 10;
  };

  const emitReadAll = () => {
    socket?.emit("read all messages", currentUserId, Number(anotherUserId));
  };

  // Find the index of the first unread message
  const getFirstUnreadIndex = () => {
    return messages.findIndex(
      (msg) => msg.sender.id !== currentUserId && msg.isRead !== "read"
    );
  };

  const firstUnreadIndex = getFirstUnreadIndex();
  const unreadCount = messages.filter(
    (msg) => msg.sender.id !== currentUserId && msg.isRead !== "read"
  ).length;

  // Only show unread divider if there are actually unread messages
  const shouldShowUnreadDivider = hasUnreadMessages && unreadCount > 0;

  // Handle scroll position when chat changes or messages load
  useEffect(() => {
    // Check if there are unread messages
    const hasUnread = firstUnreadIndex !== -1;
    setHasUnreadMessages(hasUnread);

    // Only scroll if messages are loaded
    if (messages.length === 0) return;

    // Scroll to unread divider when chat changes or on initial load
    if (hasUnread && unreadDividerRef.current) {
      setTimeout(() => {
        unreadDividerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    } else {
      setTimeout(() => {
        scrollToBottom();
      }, 150);
    }
  }, [anotherUserId, messages.length, firstUnreadIndex]);

  // Handle scroll events
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (isAtBottom()) {
        emitReadAll();
        setShowScrollButton(false);
        setHasUnreadMessages(false);
      } else {
        setShowScrollButton(true);
      }
    };

    el.addEventListener("scroll", handleScroll);

    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, [messages]);

  const formatTime = (timestamp: Date) => {
    return timestamp?.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={messagesContainerRef}
        className="h-full overflow-y-auto p-6 bg-gradient-to-b from-black via-gray-900 to-black"
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
            {messages.map((message, index) => {
              const isOwnMessage = message?.sender?.id === currentUserId;
              const showUnreadDivider = index === firstUnreadIndex && firstUnreadIndex !== -1;

              return (
                <React.Fragment key={message?.id}>
                  {/* Unread Messages Divider */}
                  {showUnreadDivider && shouldShowUnreadDivider && anotherUserId != "0" && (
                    <div
                      ref={unreadDividerRef}
                      className="flex items-center gap-3 my-6"
                    >
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
                      <span className="text-xs font-medium text-blue-400 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/30">
                        {unreadCount} Unread {unreadCount === 1 ? "Message" : "Messages"}
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
                    </div>
                  )}

                  <div
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs relative lg:max-w-md min-w-24 pr-5 pl-3 py-1 pb-4 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl ${isOwnMessage
                        ? "bg-gradient-to-r from-white to-gray-200 text-black rounded-br-md"
                        : "bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-bl-md border border-white/10"
                        }`}
                    >
                      {anotherUserId === "0" && (
                        <div className="text-sm leading-relaxed font-semibold mb-1">
                          {message?.sender.name}
                        </div>
                      )}
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
                </React.Fragment>
              );
            })}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll Button */}
      {showScrollButton && (
        <button
          onClick={scrollToUnread}
          className="absolute bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 z-10 group"
          aria-label={hasUnreadMessages ? "Scroll to unread messages" : "Scroll to bottom"}
        >
          <ArrowDown size={20} className="group-hover:animate-bounce" />
          {hasUnreadMessages && unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
};

export default MessageList;