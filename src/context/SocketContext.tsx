import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { type SocketContextType } from "../types/context";
import { createContext } from "react";

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  socketRef: null
});

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);


  useEffect(() => {
    // Connect to the server
    const newSocket = io(import.meta.env.VITE_API_URL);

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, socketRef }}>
      {children}
    </SocketContext.Provider>
  );
};
