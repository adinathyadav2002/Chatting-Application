import type { User } from "./user";

export interface Message {
  id?: number;
  content: string;
  receiverId?: number;
  sender: {
    id: number;
    name?: string;
  };
  createdAt: Date;
  isGlobal: boolean;
  isRead?: string;
}

export interface PrivateMessage {
  id?: string | number;
  senderId: string | number;
  receiverId?: string | number;
  content: string;
  timestamp: Date;
}

export interface Room {
  id: string;
  name: string;
  users: User[];
  messages: Message[];
}

export interface SocketMessage {
  senderId: number;
  name: string;
  content: string;
  timestamp: string;
}
