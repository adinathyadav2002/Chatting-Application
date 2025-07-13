import { createContext, useContext, useState } from "react";

const UserContext = createContext();

interface userDataType {
  id: number | null;
  username: string;
  password?: string;
  isOnline: boolean;
  avatar?: string;
  socketId?: string | null;
}

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

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context)
    return new Error("The user context used outside the user context Provider");
  return context;
}
