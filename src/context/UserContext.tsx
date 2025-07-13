import { createContext, useContext, useEffect, useState } from "react";
import userServices from "../services/userServices";
import { useNavigate } from "react-router-dom";

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

  const handleUpdateUser = (user: userDataType) => {
    setUserdata((prev) => ({
      ...prev,
      ...user,
    }));
  };

  // get user data from api

  return (
    <UserContext.Provider
      value={{
        userdata,
        handleUpdateUser,
        handleUserData: setUserdata,
        isLoggedIn,
        setIsLoggedIn,
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
