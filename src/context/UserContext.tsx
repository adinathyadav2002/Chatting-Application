import { createContext, useEffect, useState } from "react";
import userServices from "../services/userServices";
import { useSocket } from "../hooks/useSocket";
import type { UserContextType, userDataType } from "../types/context";

export const UserContext = createContext<UserContextType | undefined>(undefined);

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
      if (result?.success) {
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

        socket?.emit("user connected", { userId: user?.id });
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

