import React, { useState, useEffect, useRef } from "react";
import type { GlobalMessages, Message, PrivateMessage } from "../types";
import type { User } from "../types/user";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import Avatar from "../components/Avatar";
import { useSocket } from "../hooks/useSocket";
import { useNavigate } from "react-router-dom";
import userServices from "../services/userServices";
import { messageServices } from "../services/messageServices";
import { useUserContext } from "../hooks/useUser";
import { FaVideo } from "react-icons/fa";
import VideoCallingModal from "../components/VideoCallingModal";
import { usePeerContext } from "../hooks/usePeer";

const Home: React.FC = () => {
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
  const navigate = useNavigate();
  const [videoModal, setVideoModal] = useState<"receiving" | "off" | "calling" | "live">("off");
  const offerRef = useRef<RTCSessionDescriptionInit | null>(null);

  const [activeChat, setActiveChat] = useState<"global" | User>("global");
  const [users, setUsers] = useState<User[]>([]);

  const { createOffer, createAnswer, sendStream, addIceCandidate, remoteStream, assignNewPeer } = usePeerContext();
  const { userdata, isLoggedIn, handleUpdateUser, setIsLoggedIn, roomId, setRoomId, roomIdRef } =
    useUserContext();
  const { socket, isConnected } = useSocket();

  const myStreamRef = useRef<MediaStream | null>(null);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);

  const getUserMediaStream = async () => {
    if (myStreamRef.current) return myStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });

    myStreamRef.current = stream;
    setMyStream(stream); // only for UI
    return stream;
  };


  useEffect(() => {
    if (!socket) return;

    socket.on("want to video call", async (roomId, offer) => {
      if (roomIdRef) roomIdRef.current = roomId

      await getUserMediaStream();

      offerRef.current = offer;
      setRoomId(roomId);
      setVideoModal("receiving");
    });
    return () => {
      socket.off("want to video call");
    };

  }, [socket])

  useEffect(() => {
    if (!socket) return;

    socket.on("ice-candidate", async (data: { candidate: RTCIceCandidateInit }) => {
      try {
        if (data.candidate) addIceCandidate(data.candidate);
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });

    return () => {
      socket.off("ice-candidate");
    };
  }, [socket]);

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
    if (!socket) return;
    socket.on(
      "Global message",
      (messageData: {
        sender: any;
        senderId: string;
        name: string;
        content: string;
        createdAt: string;
      }) => {
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

    return () => {
      socket.off("Global message");
      socket.off("Private message");
    };
  }, [socket, isLoggedIn, navigate, userdata.id, users]);

  const handleVideoCallReponse = async (response: "accept" | "reject") => {
    if (!socket) {
      return;
    }

    if (!offerRef.current) {
      socket.emit("reject video call", userdata.id, roomId);
      return;
    }

    if (response == "accept") {

      const stream = await getUserMediaStream();
      await sendStream(stream);

      const ans = await createAnswer(offerRef.current);
      socket.emit("received video call", userdata.id, roomId, ans);
      setVideoModal("live");
    }

    if (response == "reject") {
      socket.emit("rejected video call", userdata.id, roomId);
    }
  }

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

      socket.emit("Global message", messageData);
    } else {
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

  const handleVideoCall = async (receiverId: number | undefined) => {
    try {
      const stream = await getUserMediaStream();

      const newRoomId = `room-${userdata.id}-${receiverId}-${Date.now()}`;

      setRoomId(newRoomId);
      if (roomIdRef) roomIdRef.current = newRoomId;

      await sendStream(stream);

      const offer = await createOffer();

      socket?.emit("initiate video call", receiverId, userdata.id, offer, newRoomId);
      setVideoModal(() => "calling");
    } catch (error) {
      console.error("🎬 Error in handleVideoCall:", error);
    }
  }


  const getCurrentMessages = () => {
    if (activeChat === "global") {
      return messages;
    } else {
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

          })
        );
    }
  };

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
        id: activeChat.id
      };
    }
  };

  function handleChangeModal(modal: "receiving" | "off" | "calling" | "live") {
    setVideoModal(() => modal);
  }

  const handleEndCall = () => {

    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }

    assignNewPeer();

    //  end call for other peer
    if (socket) socket.emit("ended call", roomIdRef?.current)

    if (roomIdRef)
      roomIdRef.current = null;
    offerRef.current = null;

    setVideoModal("off");
  }

  useEffect(() => {
    if (!socket) return;
    socket.on("ended call", () => {
      handleEndCall();
    });

    return () => {
      socket.off("ended call");
    };
  }, [socket]);

  const headerInfo = getChatHeader();

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900">
      {videoModal != "off" && <VideoCallingModal st={videoModal} onChangeModal={handleChangeModal} handleVideoCallReponse={handleVideoCallReponse} myStream={myStream} handleEndCall={handleEndCall} />}

      <div className="flex h-screen w-full bg-linear-to-br from-gray-900 via-black to-gray-900">
        {/* Left Sidebar - Conversations */}
        <div className="w-80 bg-linear-to-b from-gray-900 to-black border-r border-white/10 flex flex-col">
          {/* Sidebar Header */}
          <div className="px-4 h-19 bg-black/40 backdrop-blur-sm border-b border-white/10 flex flex-row items-center justify-between text-gray-400">
            <div className="flex  gap-2 items-center">
              <img src="./logo_bg.png" className="rounded-3xl w-8 h-8"></img>
              <h2 className="text-lg font-semibold text-white ">STANGERS LIVE</h2>
            </div>
            <div className="flex h-4 items-center gap-2 text-sm ">
              <button
                onClick={handleLogout}
                className="cursor-pointer px-3 py-2 rounded-2xl bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {/* Global Chat Row */}
            <div
              onClick={() => handleChatSelect("global")}
              className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${activeChat === "global"
                ? "bg-white/10 border-l-4 border-l-white"
                : ""
                }`}
            >
              <div className="flex items-center gap-3">
                <Avatar type="global" size="lg" emoji="G" />
                <div className="flex-1">
                  <h3 className="font-medium text-white">Global Chat</h3>
                  <p className="text-sm text-gray-400">
                    {users.filter((u) => u.isOnline).length} users online
                  </p>
                </div>
              </div>
            </div>

            {/* Private Conversations */}
            {conversations.map((conversation) => (
              <div
                key={conversation.user.id}
                onClick={() => handleChatSelect(conversation.user)}
                className={`p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${activeChat !== "global" &&
                  activeChat.id === conversation.user.id
                  ? "bg-white/10 border-l-4 border-l-white"
                  : ""
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    type="user"
                    name={conversation.user.name}
                    size="lg"
                    isOnline={conversation.user.isOnline}
                    emoji={conversation.user.avatar}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white truncate">
                        {conversation.user.name}
                      </h3>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-white text-black text-xs rounded-full px-2 py-1 min-w-5 text-center font-semibold">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <p className="text-sm text-gray-400 truncate">
                        {conversation.lastMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Other Users */}
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
                  className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${activeChat !== "global" && activeChat.id === user.id
                    ? "bg-white/10 border-l-4 border-l-white"
                    : ""
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      type="user"
                      name={user.name}
                      size="lg"
                      isOnline={user.isOnline}
                      emoji={user.avatar}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{user.name}</h3>
                      <p className="text-sm text-gray-400">
                        {user.isOnline ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right Main Chat Area */}
        <div className="flex-1 flex flex-col bg-linear-to-br from-black to-gray-900">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 bg-black/40 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeChat !== "global" ? (
                  <Avatar type="user" name={activeChat.name} size="md" emoji={activeChat.avatar} />
                ) : (
                  <Avatar type="global" size="md" emoji="G" />
                )}
                <div>
                  <h3 className="font-semibold text-white">
                    {headerInfo.title}
                  </h3>
                  <p className="text-sm text-gray-400">{headerInfo.subtitle}</p>
                </div>
              </div>
              <div>
                {activeChat != "global" && headerInfo.subtitle != "Offline" &&
                  <button className="cursor-pointer bg-linear-to-r from-white to-gray-300 text-black p-3 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-200 hover:scale-105 active:scale-95" onClick={() => handleVideoCall(headerInfo.id)}>
                    <FaVideo size={20} />
                  </button>}
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
    </div >
  );

};

export default Home;