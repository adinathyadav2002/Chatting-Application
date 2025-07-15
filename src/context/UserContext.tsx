import { createContext, useContext, useEffect, useState } from "react";
import userServices from "../services/userServices";
import { useSocket } from "../hooks/useSocket";

interface userDataType {
  id: number | null;
  name?: string;
  email?: string;
  isOnline: boolean;
  avatar?: string;
  socketId?: string | null;
}

interface UserContextType {
  userdata: userDataType;
  handleUpdateUser: (user: userDataType) => void;
  handleUserData: (user: userDataType) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setNavigateFn: (navigateFn: ((path: string) => void) | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userdata, setUserdata] = useState<userDataType>({
    id: null,
    isOnline: false,
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { socket } = useSocket();
  const [navigateFn, setNavigateFn] = useState<((path: string) => void) | null>(
    null
  );

  const handleUpdateUser = (user: userDataType) => {
    setUserdata((prev) => ({
      ...prev,
      ...user,
    }));
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const result = await userServices.getUserByToken();
      console.log(result);
      if (result.success) {
        const user = result?.user;
        setIsLoggedIn(true);
        handleUpdateUser({
          id: user.id,
          name: user.name,
          email: user.email,
          isOnline: user.isOnline,
          avatar: user.avatar,
          socketId: socket?.id || null,
        });

        socket?.emit("user connected", { userId: parseInt(user?.id) });
      } else {
        setIsLoggedIn(false);
        navigateFn?.("/login");
      }
    };
    fetchUserData();
  }, [socket, navigateFn]); // Added socket dependency

  return (
    <UserContext.Provider
      value={{
        userdata,
        handleUpdateUser,
        handleUserData: setUserdata,
        isLoggedIn,
        setIsLoggedIn,
        setNavigateFn,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserContextProvider");
  }
  return context;
}
