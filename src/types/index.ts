import type { User } from "./user";

export interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  // isRead: boolean;
}

export interface Room {
  id: string;
  name: string;
  users: User[];
  messages: Message[];
}

export interface SocketMessage {
  senderId: string;
  name: string;
  content: string;
  timestamp: string;
}

export interface GlobalMessages {
  id: string;
  content: string;
  sender: {
    id: number;
    name: string;
    email: string;
    socketId?: string;
  };
  receiverId: number | null;
  createdAt: Date;
  isGlobal: boolean;
}
