import React, { useState, useEffect, useRef } from "react";
import type { Message } from "../types";
import type { User } from "../types/user";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import Avatar from "../components/Avatar";
import { useSocket } from "../hooks/useSocket";
import { useNavigate, useParams } from "react-router-dom";
import userServices from "../services/userServices";
import { messageServices } from "../services/messageServices";
import { useUserContext } from "../hooks/useUser";
import { FaVideo } from "react-icons/fa";
import { ArrowLeft } from "lucide-react";
import VideoCallingModal from "../components/VideoCallingModal";
import { usePeerContext } from "../hooks/usePeer";

const Home: React.FC = () => {
  const { anotherUserId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
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

  const [activeChat, setActiveChat] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [hasMoreGlobalMessages, setHasMoreGlobalMessages] = useState(false);
  const [hasMorePrivateMessages, setHasMorePrivateMessages] = useState(false);

  const { createOffer, createAnswer, sendStream, remoteStream, assignNewPeer, addIceCandidate, setRemoteAns } = usePeerContext();
  const { userdata, isLoggedIn, handleUpdateUser, setIsLoggedIn, roomId, setRoomId, roomIdRef } =
    useUserContext();
  const { socket, isConnected } = useSocket();

  const myStreamRef = useRef<MediaStream | null>(null);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);

  const getUserMediaStream = async () => {
    if (myStreamRef.current && myStreamRef.current.active) return myStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });

    myStreamRef.current = stream;
    setMyStream(stream); // only for UI
    return stream;
  };

  useEffect(() => {
    if (!activeChat && anotherUserId) {
      const user = users.find((user) => {
        return user.id === Number(anotherUserId)
      });

      console.log("set active  user" + user);
      if (user) setActiveChat(user);

    }
  }, [users])

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = async (incomingRoomId: string, offer: RTCSessionDescriptionInit) => {
      setRoomId(incomingRoomId);
      if (roomIdRef) roomIdRef.current = incomingRoomId;
      if (offerRef) offerRef.current = offer;

      try {
        const stream = await getUserMediaStream();
        await sendStream(stream);
      } catch (err) {
        console.error("Camera/Mic permission failed:", err);
      }

      setVideoModal("receiving");
    };

    const handleIceCandidate = async ({ candidate, userId }: { candidate: RTCIceCandidateInit, userId?: number }) => {
      if (candidate) {
        await addIceCandidate(candidate);
      }
    };

    socket.on("want to video call", handleIncomingCall);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("want to video call", handleIncomingCall);
      socket.off("ice-candidate", handleIceCandidate);
    };

  }, [socket, anotherUserId, addIceCandidate, sendStream]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiverAccepted = async (ans: RTCSessionDescriptionInit) => {
      await setRemoteAns(ans);
      handleChangeModal("live");
    };

    socket.on("receiver accepted call", handleReceiverAccepted);

    return () => {
      socket.off("receiver accepted call", handleReceiverAccepted);
    };
  }, [socket, setRemoteAns, handleChangeModal]);

  useEffect(() => {
    const fetchGlobalMessages = async (page: number = 1) => {
      try {
        const response = await messageServices.getGlobalMessages(page);

        const newMessages: Message[] = response.messages.map((msg: Message) => ({
          id: msg.id,
          sender: {
            id: msg.sender.id,
            name: msg.sender.name
          },
          content: msg.content,
          isGlobal: msg.isGlobal,
          createdAt: new Date(msg.createdAt),
          type: "text",
        }));

        if (page === 1) {
          setMessages(() => [...newMessages]);
        } else {
          setMessages((prev) => [...newMessages, ...prev]);
        }

        setHasMoreGlobalMessages(response.pagination.hasNextPage);
      } catch (error) {
        console.error("Error fetching global messages:", error);
      }
    };

    if (anotherUserId == "0") fetchGlobalMessages();
  }, [userdata, anotherUserId]);

  useEffect(() => {
    const fetchPrivateMessages = async (page: number = 1) => {
      try {
        if (!userdata.id) return;
        const response = await messageServices.getPrivateMessages(userdata.id, Number(anotherUserId), page);
        const newPrivateMessages: Message[] = response.messages.map(
          (msg: Message) => ({
            id: Number(msg.id),
            sender: { id: msg.sender.id },
            receiverId: msg.receiverId,
            content: msg.content,
            createdAt: new Date(msg.createdAt),
            isGlobal: false,
            isRead: msg.isRead,
          })
        );

        if (page === 1) {
          setMessages(() => [...newPrivateMessages]);
        } else {
          setMessages((prev) => [...newPrivateMessages, ...prev]);
        }

        setHasMorePrivateMessages(response.pagination.hasNextPage);
      } catch (error) {
        console.error("Error fetching private messages:", error);
      }
    };

    if (anotherUserId != "0") fetchPrivateMessages();
  }, [userdata, anotherUserId]);

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
  }, [userdata, anotherUserId]);

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
        if (anotherUserId == "1") return;
        const newMessage: Message = {
          sender: {
            id: messageData.sender.id,
            name: messageData.sender.name,
          },
          content: messageData.content,
          createdAt: new Date(messageData.createdAt),
          isGlobal: true,
        };

        setMessages((prev) => [...prev, newMessage]);
      }
    );

    socket.on("Private message", (messageData: Message) => {
      if (anotherUserId == "0") return;
      if (anotherUserId != messageData.receiverId && anotherUserId && anotherUserId != messageData.sender.id.toString()) return;
      const newMessage: Message = {
        id: messageData.id,
        sender: {
          id: messageData.sender.id
        },
        receiverId: messageData.receiverId,
        content: messageData.content,
        createdAt: new Date(messageData.createdAt),
        isGlobal: false,
        isRead: messageData.isRead,
      };

      if (!messageData.receiverId) return;

      const otherUserId =
        messageData.sender.id === userdata.id
          ? messageData.receiverId
          : messageData.sender.id;

      setMessages((prev) => [...prev, newMessage]);

      const user = users.find((u) => u.id === otherUserId);
      if (user) {
        setConversations((prev) => {
          const existing = prev.find(
            (c) => c.user.id === otherUserId
          );
          if (existing) {
            return prev.map((c) =>
              c.user.id === otherUserId
                ? {
                  ...c,
                  lastMessage: newMessage.content,
                  lastMessageTime: newMessage.createdAt,
                  unreadCount:
                    messageData.sender.id !==
                      userdata.id
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
                lastMessageTime: newMessage.createdAt,
                unreadCount:
                  messageData.sender.id !== userdata.id
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

    const currentRoomId = roomIdRef?.current || roomId;

    if (!offerRef.current) {
      socket.emit("reject video call", userdata.id, currentRoomId);
      return;
    }

    if (response == "accept") {
      const stream = await getUserMediaStream();
      await sendStream(stream);

      const ans = await createAnswer(offerRef.current);
      socket.emit("received video call", userdata.id, currentRoomId, ans);
      setVideoModal("live");
    }

    if (response == "reject") {
      socket.emit("rejected video call", userdata.id, currentRoomId);
    }
  }

  const handleSendMessage = (content: string) => {
    if (!socket || !isConnected || !userdata.id) {
      return;
    }

    if (anotherUserId == "0") {
      const messageData = {
        userId: userdata.id.toString(),
        content,
        timestamp: new Date().toISOString(),
      };

      socket.emit("Global message", messageData);
    } else {
      const messageData = {
        content,
        senderId: userdata.id.toString(),
        receiverId: anotherUserId,
        timestamp: new Date().toISOString(),
      };

      socket.emit("Private message", messageData);
    }
  };

  const handleChatSelect = (chat: User) => {
    console.log(chat);
    setActiveChat(chat);

    navigate(`/home/${chat.id}`)
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

  function handleChangeModal(modal: "receiving" | "off" | "calling" | "live") {
    setVideoModal(() => modal);
  }

  const handleEndCall = () => {
    // Stop local camera and microphone tracks completely
    if (myStreamRef.current) {
      myStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log(`🛑 Stopped track: ${track.kind}`);
      });
      myStreamRef.current = null;
    }

    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
      setMyStream(null);
    }

    // Stop remote stream tracks
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }

    assignNewPeer();

    // End call for other peer via socket
    if (socket && roomIdRef?.current) {
      socket.emit("ended call", roomIdRef.current);
    }

    if (roomIdRef) roomIdRef.current = null;
    offerRef.current = null;

    setVideoModal("off");
  };

  const loadMoreGlobalMessages = async (page: number) => {
    const fetchGlobalMessages = async (page: number) => {
      try {
        const response = await messageServices.getGlobalMessages(page);

        const newMessages: Message[] = response.messages.map((msg: Message) => ({
          id: msg.id,
          sender: {
            id: msg.sender.id,
            name: msg.sender.name
          },
          content: msg.content,
          isGlobal: msg.isGlobal,
          createdAt: new Date(msg.createdAt),
          type: "text",
        }));

        setMessages((prev) => [...newMessages, ...prev]);
        setHasMoreGlobalMessages(response.pagination.hasNextPage);
      } catch (error) {
        console.error("Error fetching global messages:", error);
      }
    };
    await fetchGlobalMessages(page);
  };

  const loadMorePrivateMessages = async (page: number) => {
    const fetchPrivateMessages = async (page: number) => {
      try {
        if (!userdata.id) return;
        const response = await messageServices.getPrivateMessages(userdata.id, Number(anotherUserId), page);
        const newPrivateMessages: Message[] = response.messages.map(
          (msg: Message) => ({
            id: Number(msg.id),
            sender: { id: msg.sender.id },
            receiverId: msg.receiverId,
            content: msg.content,
            createdAt: new Date(msg.createdAt),
            isGlobal: false,
            isRead: msg.isRead,
          })
        );

        setMessages((prev) => [...newPrivateMessages, ...prev]);
        setHasMorePrivateMessages(response.pagination.hasNextPage);
      } catch (error) {
        console.error("Error fetching private messages:", error);
      }
    };
    await fetchPrivateMessages(page);
  };

  const handleMessagesRead = (messageIds: number[]) => {
    if (!messageIds.length || !userdata.id || !anotherUserId || anotherUserId === "0") return;

    const otherUserId = Number(anotherUserId);

    // Update local messages state to read
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id && messageIds.includes(msg.id) && msg.isRead !== "read"
          ? { ...msg, isRead: "read" as const }
          : msg
      )
    );

    // Decrement unread count for this conversation in the sidebar
    setConversations((prev) =>
      prev.map((c) =>
        c.user.id === otherUserId
          ? {
              ...c,
              unreadCount: Math.max(0, c.unreadCount - messageIds.length),
            }
          : c
      )
    );

    // Emit socket event to persist and inform sender
    if (socket) {
      socket.emit("read messages", {
        senderId: userdata.id,
        receiverId: otherUserId,
        messageIds,
      });
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleMessagesReadEvent = ({
      receiverId,
      messageIds,
    }: {
      receiverId: number;
      messageIds?: number[];
    }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          const isSender = msg.sender.id === receiverId;
          const isIdMatch =
            !messageIds ||
            messageIds.length === 0 ||
            (msg.id != null && messageIds.includes(msg.id));
          return isSender && isIdMatch && msg.isRead !== "read"
            ? { ...msg, isRead: "read" as const }
            : msg;
        })
      );
    };

    socket.on("messages read", handleMessagesReadEvent);

    return () => {
      socket.off("messages read", handleMessagesReadEvent);
    };
  }, [socket]);


  useEffect(() => {
    if (!socket) return;
    socket.on("ended call", () => {
      handleEndCall();
    });

    return () => {
      socket.off("ended call");
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900">
      {videoModal != "off" && <VideoCallingModal st={videoModal} onChangeModal={handleChangeModal} handleVideoCallReponse={handleVideoCallReponse} myStream={myStream} handleEndCall={handleEndCall} />}

      <div className="flex h-screen w-full bg-linear-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
        {/* Left Sidebar - Conversations */}
        <div className={`w-full md:w-80 md:min-w-80 bg-linear-to-b from-gray-900 to-black border-r border-white/10 flex flex-col h-full ${
          anotherUserId ? "hidden md:flex" : "flex"
        }`}>
          {/* Sidebar Header */}
          <div className="px-4 h-19 bg-black/40 backdrop-blur-sm border-b border-white/10 flex flex-row items-center justify-between text-gray-400">
            <div className="flex gap-2 items-center">
              <img src="/logo_bg.png" className="rounded-3xl w-8 h-8" alt="Logo"></img>
              <h2 className="text-lg font-semibold text-white tracking-wide">STRANGERS LIVE</h2>
            </div>
            <div className="flex h-4 items-center gap-2 text-sm">
              <button
                onClick={handleLogout}
                className="cursor-pointer px-3 py-1.5 md:py-2 rounded-2xl bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs md:text-sm transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {/* Global Chat Row */}
            <div
              onClick={() => navigate("/home/0")}
              className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${anotherUserId === "0"
                ? "bg-white/10 border-l-4 border-l-white"
                : ""
                }`}
            >
              <div className="flex items-center gap-3">
                <Avatar type="global" name="global" size="lg" emoji="G" />
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
                className={`p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${anotherUserId !== "global" &&
                  Number(anotherUserId) === conversation.user.id
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
                  className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${anotherUserId !== "0" && Number(anotherUserId) === user.id
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
        <div className={`flex-1 flex flex-col h-full bg-linear-to-br from-black to-gray-900 ${
          !anotherUserId ? "hidden md:flex" : "flex"
        }`}>
          {/* Chat Header */}
          <div className="p-3 md:p-4 border-b border-white/10 bg-black/40 backdrop-blur-sm">
            {anotherUserId === "0" ? (
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => navigate("/home")}
                  className="md:hidden text-gray-400 hover:text-white p-2 -ml-1 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={20} />
                </button>
                <Avatar type="global" name="global" size="md" emoji="G" />
                <div>
                  <h3 className="font-semibold text-white">
                    Global
                  </h3>
                  <p className="text-xs md:text-sm text-gray-400">{`${users.filter((u) => u.isOnline).length} users online`}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <button
                    onClick={() => navigate("/home")}
                    className="md:hidden text-gray-400 hover:text-white p-2 -ml-1 rounded-full hover:bg-white/10 transition-colors"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <Avatar type="user" name={activeChat?.name} size="md" emoji={activeChat?.avatar} />
                  <div>
                    <h3 className="font-semibold text-white">
                      {activeChat?.name}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-400">{activeChat?.isOnline ? "Online" : "Offline"}</p>
                  </div>
                </div>
                <div>
                  {anotherUserId != "0" && activeChat?.isOnline &&
                    <button className="cursor-pointer bg-linear-to-r from-white to-gray-300 text-black p-2.5 md:p-3 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-200 hover:scale-105 active:scale-95" onClick={() => handleVideoCall(Number(anotherUserId))}>
                      <FaVideo size={18} />
                    </button>}
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <MessageList
            messages={messages}
            currentUserId={userdata.id || 0}
            onLoadMore={anotherUserId === "0" ? loadMoreGlobalMessages : loadMorePrivateMessages}
            hasMoreMessages={anotherUserId === "0" ? hasMoreGlobalMessages : hasMorePrivateMessages}
            onMessagesRead={handleMessagesRead}
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