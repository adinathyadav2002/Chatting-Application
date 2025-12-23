import type { RefObject } from "react";
import { Socket } from "socket.io-client";

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  socketRef: RefObject<Socket | null> | null;
}

export interface userDataType {
  id: number | null;
  name?: string;
  email?: string;
  isOnline: boolean;
  avatar?: string;
  socketId?: string | null;
}

export interface UserContextType {
  userdata: userDataType;
  handleUpdateUser: (user: userDataType) => void;
  handleUserData: (user: userDataType) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setNavigateFn: (navigateFn: ((path: string) => void) | null) => void;
  roomId: string;
  setRoomId: (roomId: string) => void;
  userIdRef?: RefObject<number | null>;
  roomIdRef?: RefObject<string | null>;
}
