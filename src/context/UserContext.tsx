import { createContext, useContext, useState } from "react";

interface userDataType {
  id: number | null;
  username: string;
  name?: string;
  password?: string;
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
    username: "",
    isOnline: false,
    socketId: null,
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleUpdateUser = (user: userDataType) => {
    setUserdata((prev) => ({
      ...prev,
      ...user,
    }));
  };

  // given id set socketId for user
  // const setSocketIdForUser = (id: string, socketId: string) => {
  //   setUserdata((prev) => ({ ...prev, socketId }));
  // };

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
