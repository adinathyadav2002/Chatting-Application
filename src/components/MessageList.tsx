import React, { useEffect, useRef, useState } from "react";
import { Check, CheckCheck, Clock, Divide, ArrowDown, Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import type { Message } from "../types";


interface MessageListProps {
  messages: Message[];
  currentUserId: number;
  onLoadMore?: (page: number) => Promise<void>;
  hasMoreMessages?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  onLoadMore,
  hasMoreMessages = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const unreadDividerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const isProgrammaticScroll = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(hasMoreMessages);

  // Track scroll position for loading more messages
  const previousScrollHeightRef = useRef<number>(0);
  const isLoadingMoreRef = useRef(false);

  const { anotherUserId } = useParams();
  const { socket } = useSocket();

  const loadMoreMessages = async () => {
    if (!onLoadMore || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    isLoadingMoreRef.current = true;
    const nextPage = currentPage + 1;

    try {
      // Store current scroll height before loading
      if (messagesContainerRef.current) {
        previousScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
      }

      await onLoadMore(nextPage);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  };

  const scrollToBottom = () => {
    isProgrammaticScroll.current = true;
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
    // Clear after a short delay
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 100);
  };

  const scrollToUnread = () => {
    isProgrammaticScroll.current = true;

    if (unreadDividerRef.current) {
      unreadDividerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
      // Reset flag after smooth scroll completes
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 1500); // Longer timeout for smooth scroll
    } else {
      scrollToBottom();
    }
  };

  const isAtBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return false;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  };

  const emitReadAll = () => {
    if (isProgrammaticScroll.current) {
      console.log("Skipping emitReadAll - programmatic scroll");
      return;
    }

    const count = messages.reduce((acc, mes) => {
      if (
        (mes.isRead === "not-send" || mes.isRead === "send") &&
        mes.sender.id === Number(anotherUserId)
      ) {
        return acc + 1;
      }
      return acc;
    }, 0);

    if (count !== 0 && socket) {
      socket.emit("read all messages", currentUserId, Number(anotherUserId));
    }
  };

  const getFirstUnreadIndex = () => {
    return messages.findIndex(
      (msg) => msg.sender.id !== currentUserId && msg.isRead !== "read"
    );
  };

  const firstUnreadIndex = getFirstUnreadIndex();
  const unreadCount = messages.filter(
    (msg) => msg.sender.id !== currentUserId && msg.isRead !== "read"
  ).length;

  const shouldShowUnreadDivider = hasUnreadMessages && unreadCount > 0;

  // Handle initial scroll when chat loads or changes
  useEffect(() => {
    const hasUnread = firstUnreadIndex !== -1;
    setHasUnreadMessages(hasUnread);

    if (messages.length === 0) return;

    // Set programmatic scroll flag
    isProgrammaticScroll.current = true;

    const scrollTimer = setTimeout(() => {
      if (hasUnread && unreadDividerRef.current) {
        unreadDividerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        // Keep flag set during smooth scroll
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 1500);
      } else {
        scrollToBottom();
      }
    }, 150);

    return () => {
      clearTimeout(scrollTimer);
    };
  }, [anotherUserId, messages.length]);

  // Separate effect for new messages
  useEffect(() => {
    // Only scroll to bottom for new messages if user was already at bottom
    if (messages.length > 0) {
      const wasAtBottom = isAtBottom();
      if (wasAtBottom) {
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    }
  }, [messages.length]);

  // Preserve scroll position when loading more messages
  useEffect(() => {
    if (!isLoadingMore && previousScrollHeightRef.current > 0 && messagesContainerRef.current) {
      const el = messagesContainerRef.current;
      const newScrollHeight = el.scrollHeight;
      const scrollDifference = newScrollHeight - previousScrollHeightRef.current;
      
      // Adjust scroll position to account for new messages at the top
      el.scrollTop += scrollDifference;
      previousScrollHeightRef.current = 0;
    }
  }, [messages.length, isLoadingMore]);

  // Update hasMore when prop changes and also initialize on mount
  useEffect(() => {
    setHasMore(hasMoreMessages);
  }, [hasMoreMessages, messages.length]); // Add messages.length to trigger when messages load

  // Handle scroll events
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      // CRITICAL: Skip all logic during programmatic scrolls
      if (isProgrammaticScroll.current) {
        console.log("Ignoring scroll event - programmatic");
        return;
      }

      const atBottom = isAtBottom();
      const atVeryTop = el.scrollTop <= 10; // At the very top threshold

      // Load more messages ONLY when at the very top and trying to scroll up further
      if (atVeryTop && hasMore && !isLoadingMore && !isLoadingMoreRef.current) {
        loadMoreMessages();
      }

      if (atBottom) {
        emitReadAll();
        setShowScrollButton(false);
        setHasUnreadMessages(false);
      } else {
        setShowScrollButton(true);
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages, currentUserId, anotherUserId]);

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
        className="h-full overflow-y-auto p-6 bg-linear-to-b from-black via-gray-900 to-black"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
            <Divide size={40} className="mb-4 opacity-40" />
            <p className="text-base tracking-wide">No messages yet</p>
            <p className="text-base text-gray-500 mt-1">
              Start the conversation ✨
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 size={24} className="animate-spin text-gray-400" />
              </div>
            )}
            {messages.map((message, index) => {
              const isOwnMessage = message?.sender?.id === currentUserId;
              const showUnreadDivider =
                index === firstUnreadIndex && firstUnreadIndex !== -1;

              return (
                <React.Fragment key={message.id || message.content}>
                  {showUnreadDivider &&
                    shouldShowUnreadDivider &&
                    anotherUserId !== "0" && (
                      <div
                        ref={unreadDividerRef}
                        className="flex items-center gap-3 my-6"
                      >
                        <div className="flex-1 h-px bg-linear-to-r from-transparent via-blue-500 to-transparent"></div>
                        <span className="text-xs font-medium text-blue-400 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/30">
                          {unreadCount} Unread{" "}
                          {unreadCount === 1 ? "Message" : "Messages"}
                        </span>
                        <div className="flex-1 h-px bg-linear-to-r from-transparent via-blue-500 to-transparent"></div>
                      </div>
                    )}

                  <div
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div
                      className={`max-w-xs relative lg:max-w-md min-w-24 pr-5 pl-3 py-1 pb-4 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl ${isOwnMessage
                        ? "bg-linear-to-r from-white to-gray-200 text-black rounded-br-md"
                        : "bg-linear-to-br from-gray-800 to-gray-900 text-white rounded-bl-md border border-white/10"
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
                          <Clock
                            size={12}
                            className="text-gray-400 animate-pulse"
                          />
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

      {showScrollButton && (
        <button
          onClick={scrollToUnread}
          className="absolute bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 z-10 group"
          aria-label={
            hasUnreadMessages ? "Scroll to unread messages" : "Scroll to bottom"
          }
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