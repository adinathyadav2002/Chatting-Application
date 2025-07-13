export interface User {
  id: number;
  name: string;
  password?: string; // Optional for dummy data, not used in production
  isOnline: boolean;
  avatar?: string;
}

export interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  type: "text" | "system" | "private";
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
