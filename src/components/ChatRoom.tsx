import React, { useState, useEffect } from "react";
import type {
  GlobalMessages,
  Message,
  SocketMessage,
  User,
  PrivateMessage,
} from "../types";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import UserListItem from "./UserListItem";
import PrivateMessageModal from "./PrivateMessageModal";
import PrivateMessagesList from "./PrivateMessagesList";
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
  const [isPrivateModalOpen, setIsPrivateModalOpen] = useState(false);

  // for private chat user
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isConversationsVisible, setIsConversationsVisible] = useState(false);

  const { userdata, isLoggedIn } = useUserContext();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [users, setUsers] = React.useState<User[]>([]);

  // fetch global messages
  useEffect(() => {
    if (!userdata.id) return;

    const fetchGlobalMessages = async () => {
      try {
        const response = await messageServices.getGlobalMessages();

        const newMessages: Message[] = response.map((msg: GlobalMessages) => ({
          id: msg.id,
          userId: msg.sender.id || "unknown",
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
  }, []);

  useEffect(() => {
    if (!userdata.id) return;

    const fetchPrivateMessages = async () => {
      try {
        const response = await messageServices.getPrivateMessages(userdata.id);
        const newPrivateMessages: PrivateMessage[] = response.map(
          (msg: GlobalMessages) => ({
            id: msg.id,
            senderId: msg.sender.id || "unknown",
            receiverId: msg.receiver.id || "unknown",
            content: msg.content,
            timestamp: new Date(msg.createdAt),
            // isRead: false,
          })
        );

        setPrivateMessages(() => [...newPrivateMessages]);
      } catch (error) {
        console.error("Error fetching private messages:", error);
      }
    };

    fetchPrivateMessages();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("online-users", (onlineUsers) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          onlineUsers.find(
            (u: { id: number; name: string }) => u.id === user.id
          )
            ? { ...user, isOnline: true }
            : user
        )
      );
    });

    return () => {
      socket.off("online-users");
    };
  }, [socket]);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await userServices.getAllUsers();

      if (response.success) {
        setUsers(response.users);
      }
    };
    fetchUsers();
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    // Listen for incoming global messages
    socket.on("Global message", (messageData: SocketMessage) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        userId: messageData.sender.id || "unknown",
        username: messageData.sender.name || "Anonymous",
        content: messageData.content,
        timestamp: new Date(messageData.sender.createdAt),
        type: "text",
      };

      setMessages((prev) => [...prev, newMessage]);
    });

    socket.on("Private message", (messageData) => {
      console.log(messageData, "Received private message data");
      const newMessage: PrivateMessage = {
        id: Date.now().toString(),
        senderId: messageData.senderId || "unknown",
        receiverId: messageData.receiverId || "unknown",
        content: messageData.content,
        // timestamp: new Date().toISOString() this is passed in messagedata.timestamp,
        timestamp: new Date(messageData.createdAt),
      };

      console.log("Received private message:", messageData.timestamp);
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

    const messageData: SocketMessage = {
      userId: userdata.id.toString(),
      name: userdata.name || "Anonymous",
      content,
      timestamp: new Date().toISOString(),
    };

    // Emit message to server
    socket.emit("Global message", messageData);
  };

  const handleSendPrivateMessage = (
    content: string,
    targetUserId: string | number
  ) => {
    if (!socket || !isConnected || !userdata.id) {
      return;
    }

    const messageData = {
      name: userdata.name || "Anonymous",
      content,
      senderId: userdata.id.toString(),
      receiverId: targetUserId.toString(),
      // give timestamp as current time
      timestamp: new Date().toISOString(),
    };

    console.log(new Date().toISOString());

    socket.emit("Private message", messageData);
  };

  const handleUserClick = (user: User) => {
    // console.log(user);
    setSelectedUser(user);
    setIsPrivateModalOpen(true);

    // Mark messages as read
    setConversations((prev) =>
      prev.map((c) => (c.user.id === user.id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleClosePrivateModal = () => {
    setIsPrivateModalOpen(false);
    setSelectedUser(null);
  };

  const handleConversationClick = (user: User) => {
    handleUserClick(user);

    setIsConversationsVisible(false);
  };

  if (!userdata.id) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sidebar - User List */}
      <div className="w-80 border-r border-gray-200 bg-gradient-to-b from-white to-gray-50 shadow-lg">
        {" "}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <h2 className="text-xl font-bold">WebSocket Chat</h2>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-blue-100">Real-time messaging</p>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                }`}
              ></span>
              <span className="text-xs text-blue-100">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>{" "}
        <div className="p-4 h-full">
          <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl p-5 h-full overflow-y-auto shadow-inner">
            <h3 className="text-lg font-bold text-gray-800 border-b-2 border-blue-200 pb-3 mb-5">
              Online Users ({users.filter((u) => u.isOnline).length})
            </h3>
            <div className="flex flex-col gap-3">
              {users?.map((user) => (
                <UserListItem
                  key={user.id}
                  user={user}
                  currentUserId={userdata.id?.toString() || ""}
                  onUserClick={handleUserClick}
                  hasUnreadMessages={conversations.some(
                    (c) => c.user.id === user.id && c.unreadCount > 0
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800">General Chat</h3>
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            {users.filter((u) => u.isOnline).length} users online
          </p>
        </div>
        {/* Messages */}
        <MessageList messages={messages} currentUserId={userdata.id} />{" "}
        {/* Message Input */}{" "}
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!isConnected}
        />
      </div>

      <PrivateMessageModal
        isOpen={isPrivateModalOpen}
        onClose={handleClosePrivateModal}
        targetUser={selectedUser}
        currentUserId={userdata.id?.toString() || ""}
        messages={
          selectedUser
            ? privateMessages?.filter(
                (msg) =>
                  (msg.receiverId === selectedUser.id &&
                    msg.senderId === userdata.id) ||
                  (msg.senderId === selectedUser.id &&
                    msg.receiverId === userdata.id)
              ) || []
            : []
        }
        onSendMessage={handleSendPrivateMessage}
        isConnected={isConnected}
      />

      <PrivateMessagesList
        conversations={conversations}
        onConversationClick={handleConversationClick}
        isVisible={isConversationsVisible}
        onToggle={() => setIsConversationsVisible(!isConversationsVisible)}
      />
    </div>
  );
};

export default ChatRoom;
