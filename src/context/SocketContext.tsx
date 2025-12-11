import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { type SocketContextType } from "../types/context";
import { createContext } from "react";

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});


export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the server
    const newSocket = io("http://localhost:4000");

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
