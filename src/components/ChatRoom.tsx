import React, { useState, useEffect } from "react";
import type { Message, SocketMessage } from "../types";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import UserList from "./UserList";
import { useSocket } from "../hooks/useSocket";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

const ChatRoom: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { userdata, isLoggedIn } = useUserContext();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    // Listen for incoming messages
    socket.on("chat message", (messageData: SocketMessage) => {
      console.log(messageData);
      const newMessage: Message = {
        id: Date.now().toString(),
        userId: messageData.userId || "unknown",
        username: messageData.username || "Anonymous",
        content: messageData.content,
        timestamp: new Date(messageData.timestamp),
        type: "text",
      };

      setMessages((prev) => [...prev, newMessage]);
    });

    // Cleanup listener on unmount
    return () => {
      socket.off("chat message");
    };
  }, [socket]);

  const handleSendMessage = (content: string) => {
    if (!socket || !isConnected) {
      console.log("Socket not connected");
      return;
    }

    const messageData: SocketMessage = {
      userId: userdata.id,
      username: userdata.username,
      content,
      timestamp: new Date().toISOString(),
    };

    // Emit message to server
    socket.emit("chat message", messageData);
  };

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
        </div>
        <div className="p-4 h-full">
          <UserList userdataId={userdata.id} />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800">General Chat</h3>
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            {/* {users.filter((u) => u.isOnline).length + 1} users online */}
          </p>
        </div>
        {/* Messages */}
        <MessageList messages={messages} userdataId={userdata.id} />{" "}
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
