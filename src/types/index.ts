export interface User {
  id: string;
  username: string;
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
  type: "text" | "system";
}

export interface Room {
  id: string;
  name: string;
  users: User[];
  messages: Message[];
}

export interface SocketMessage {
  userId: string;
  username: string;
  content: string;
  timestamp: string;
}
