import React, { useState, useEffect } from "react";
import type { GlobalMessages, Message, User, PrivateMessage } from "../types";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import Avatar from "./Avatar";
import { useSocket } from "../hooks/useSocket";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import userServices from "../services/userServices";
import { messageServices } from "../services/messageServices";

const ChatRoom: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);
  const [conversations, setConversations] = useState<
    Array<{
      user: User;
      lastMessage?: string;
      lastMessageTime?: Date;
      unreadCount: number;
    }>
  >([]);

  // WhatsApp-like state management
  const [activeChat, setActiveChat] = useState<"global" | User>("global");
  const [users, setUsers] = useState<User[]>([]);

  const { userdata, isLoggedIn, handleUpdateUser, setIsLoggedIn } =
    useUserContext();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  // fetch global messages
  useEffect(() => {
    const fetchGlobalMessages = async () => {
      try {
        const response = await messageServices.getGlobalMessages();

        const newMessages: Message[] = response.map((msg: GlobalMessages) => ({
          id: msg.id,
          userId: (msg.sender.id || "unknown").toString(),
          username: msg.sender.name || "Anonymous",
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          type: "text",
        }));
        setMessages(() => [...newMessages]);
      } catch (error) {
        console.error("Error fetching global messages:", error);
      }
    };

    fetchGlobalMessages();
  }, [userdata]);

  useEffect(() => {
    // Fetch private messages for the current user
    const fetchPrivateMessages = async () => {
      try {
        if (!userdata.id) return;
        const response = await messageServices.getPrivateMessages(userdata.id);
        const newPrivateMessages: PrivateMessage[] = response.map(
          (msg: GlobalMessages) => ({
            id: msg.id,
            senderId: (msg.sender.id || "unknown").toString(),
            receiverId: (msg.receiverId || "unknown").toString(),
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          })
        );

        setPrivateMessages(() => [...newPrivateMessages]);
      } catch (error) {
        console.error("Error fetching private messages:", error);
      }
    };

    fetchPrivateMessages();
  }, [userdata]);

  useEffect(() => {
    if (!socket) return;
    socket.on("online-users", (onlineUsers) => {
      console.log("Received online-users event:", onlineUsers);
      setUsers((prevUsers) =>
        prevUsers.map((user) => {
          const isOnline = onlineUsers.find(
            (u: { id: number; name: string }) => u.id === user.id
          );
          return { ...user, isOnline: !!isOnline };
        })
      );
    });

    return () => {
      socket.off("online-users");
    };
  }, [socket]);

  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userServices.getAllUsers();

        if (response.success) {
          setUsers(response.users);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [userdata]);

  useEffect(() => {
    if (!socket) return; // Listen for incoming global messages
    socket.on(
      "Global message",
      (messageData: {
        sender: any;
        senderId: string;
        name: string;
        content: string;
        createdAt: string;
      }) => {
        console.log(messageData, "Received global message data");
        const newMessage: any = {
          id: Date.now().toString(),
          userId: (messageData.senderId || "unknown").toString(),
          username: messageData?.sender?.name || "Anonymous",
          content: messageData.content,
          timestamp: new Date(messageData.createdAt),
          type: "text",
        };

        setMessages((prev) => [...prev, newMessage]);
      }
    );

    socket.on("Private message", (messageData) => {
      const newMessage: PrivateMessage = {
        id: Date.now().toString(),
        senderId: (messageData.senderId || "unknown").toString(),
        receiverId: (messageData.receiverId || "unknown").toString(),
        content: messageData.content,
        timestamp: new Date(messageData.createdAt),
      };

      const otherUserId =
        messageData.senderId.toString() === userdata.id?.toString()
          ? messageData.receiverId.toString()
          : messageData.senderId.toString();

      setPrivateMessages((prev) => [...prev, newMessage]);

      // Update or create conversation preview
      const user = users.find((u) => u.id.toString() === otherUserId);
      if (user) {
        setConversations((prev) => {
          const existing = prev.find(
            (c) => c.user.id.toString() === otherUserId
          );
          if (existing) {
            return prev.map((c) =>
              c.user.id.toString() === otherUserId
                ? {
                    ...c,
                    lastMessage: newMessage.content,
                    lastMessageTime: newMessage.timestamp,
                    unreadCount:
                      messageData.senderId.toString() !==
                      userdata.id?.toString()
                        ? c.unreadCount + 1
                        : c.unreadCount,
                  }
                : c
            );
          } else {
            return [
              ...prev,
              {
                user,
                lastMessage: newMessage.content,
                lastMessageTime: newMessage.timestamp,
                unreadCount:
                  messageData.senderId.toString() !== userdata.id?.toString()
                    ? 1
                    : 0,
              },
            ];
          }
        });
      }
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off("Global message");
      socket.off("Private message");
    };
  }, [socket, isLoggedIn, navigate, userdata.id, users]);

  const handleSendMessage = (content: string) => {
    if (!socket || !isConnected || !userdata.id) {
      return;
    }

    if (activeChat === "global") {
      const messageData = {
        userId: userdata.id.toString(),
        name: userdata.name || "Anonymous",
        content,
        timestamp: new Date().toISOString(),
      };

      // Emit message to server
      socket.emit("Global message", messageData);
    } else {
      // Send private message
      const messageData = {
        name: userdata.name || "Anonymous",
        content,
        senderId: userdata.id.toString(),
        receiverId: activeChat.id.toString(),
        timestamp: new Date().toISOString(),
      };

      socket.emit("Private message", messageData);
    }
  };

  const handleChatSelect = (chat: "global" | User) => {
    setActiveChat(chat);

    // Mark messages as read if selecting a private chat
    if (chat !== "global") {
      setConversations((prev) =>
        prev.map((c) => (c.user.id === chat.id ? { ...c, unreadCount: 0 } : c))
      );
    }
  };

  const handleLogout = async () => {
    try {
      const response = await userServices.logoutUser();

      if (response && response.success) {
        socket?.emit("user disconnected", { userId: userdata.id });
        setIsLoggedIn(false);
        handleUpdateUser({ id: null, isOnline: false });
        navigate("/login");
      } else {
        console.error("Logout failed:", response?.message);
      }
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggedIn(false);
      navigate("/login");
    }
  };

  // Get messages for the current active chat
  const getCurrentMessages = () => {
    if (activeChat === "global") {
      return messages;
    } else {
      // Convert private messages to Message format for display
      return privateMessages
        .filter(
          (msg) =>
            (msg.receiverId === activeChat.id.toString() &&
              msg.senderId === userdata.id?.toString()) ||
            (msg.senderId === activeChat.id.toString() &&
              msg.receiverId === userdata.id?.toString())
        )
        .map(
          (msg): Message => ({
            id: msg.id,
            userId: msg.senderId,
            username:
              users.find((u) => u.id.toString() === msg.senderId)?.name ||
              "Unknown",
            content: msg.content,
            timestamp: msg.timestamp,
            type: "text",
          })
        );
    }
  };

  // Get chat header info
  const getChatHeader = () => {
    if (activeChat === "global") {
      return {
        title: "Global Chat",
        subtitle: `${users.filter((u) => u.isOnline).length} users online`,
      };
    } else {
      return {
        title: activeChat.name,
        subtitle: activeChat.isOnline ? "Online" : "Offline",
      };
    }
  };

  const headerInfo = getChatHeader();

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Left Sidebar - Conversations */}
      <div className="w-80 bg-white border-r border-gray-300 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Chats</h2>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
            >
              Logout
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-400" : "bg-red-400"
              }`}
            ></span>
            {isConnected ? "Connected" : "Disconnected"}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {" "}
          {/* Global Chat Row */}
          <div
            onClick={() => handleChatSelect("global")}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
              activeChat === "global"
                ? "bg-blue-50 border-l-4 border-l-blue-500"
                : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar type="global" size="lg" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Global Chat</h3>
                <p className="text-sm text-gray-600">
                  {users.filter((u) => u.isOnline).length} users online
                </p>
              </div>
            </div>
          </div>{" "}
          {/* Private Conversations */}
          {conversations.map((conversation) => (
            <div
              key={conversation.user.id}
              onClick={() => handleChatSelect(conversation.user)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                activeChat !== "global" &&
                activeChat.id === conversation.user.id
                  ? "bg-blue-50 border-l-4 border-l-blue-500"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar
                  type="user"
                  name={conversation.user.name}
                  size="lg"
                  isOnline={conversation.user.isOnline}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">
                      {conversation.user.name}
                    </h3>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}{" "}
          {/* Other Users (not in conversations yet) */}
          {users
            .filter(
              (user) =>
                user.id !== userdata.id &&
                !conversations.some((c) => c.user.id === user.id)
            )
            .map((user) => (
              <div
                key={user.id}
                onClick={() => handleChatSelect(user)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  activeChat !== "global" && activeChat.id === user.id
                    ? "bg-blue-50 border-l-4 border-l-blue-500"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    type="user"
                    name={user.name}
                    size="lg"
                    isOnline={user.isOnline}
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">
                      {user.isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Right Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {" "}
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            {activeChat !== "global" ? (
              <Avatar type="user" name={activeChat.name} size="md" />
            ) : (
              <Avatar type="global" size="md" />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">
                {headerInfo.title}
              </h3>
              <p className="text-sm text-gray-600">{headerInfo.subtitle}</p>
            </div>
          </div>
        </div>
        {/* Messages */}
        <MessageList
          messages={getCurrentMessages()}
          currentUserId={userdata.id || 0}
        />
        {/* Message Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!isConnected}
        />
      </div>
    </div>
  );
};

export default ChatRoom;
