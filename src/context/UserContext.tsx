import { createContext, useContext, useState } from "react";

const UserContext = createContext();

interface userDataType {
  id: string;
  username: string;
  password?: string;
  isOnline: boolean;
  avatar?: string;
  socketId?: string; // Optional for dummy data, not used in production
}

export function UserContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dummyUsers, setDummyUsers] = useState<userDataType[]>([
    {
      id: "1",
      password: "alice123",
      username: "Alice",
      isOnline: false,
      avatar: "👩‍💻",
      socketId: "",
    },
    {
      id: "2",
      username: "Bob",
      password: "bob123",
      isOnline: false,
      avatar: "👨‍💼",
      socketId: "",
    },
    {
      id: "3",
      username: "Charlie",
      password: "charlie123",
      isOnline: false,
      avatar: "👨‍🎨",
      socketId: "",
    },
    {
      id: "4",
      username: "Diana",
      password: "diana123",
      socketId: "",
      isOnline: false,
      avatar: "👩‍🔬",
    },
    {
      id: "5",
      username: "Adinath",
      password: "a",
      isOnline: false,
      avatar: "💻",
      socketId: "",
    },
  ]);

  const [userdata, setUserdata] = useState<userDataType>({
    id: "",
    username: "",
    isOnline: false,
    socketId: "",
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // function to find user from username and password from dummy data
  const findUser = (username: string, password: string, socketId: string) => {
    const user: userDataType | undefined = dummyUsers.find(
      (user) => user.username === username && user.password === password
    );
    setUserdata((prev) => ({
      ...prev,
      id: user?.id || "",
      username: user?.username || "",
      isOnline: true,
      socketId: socketId,
    }));
    if (user) {
      setSocketIdForUser(user.id, socketId);
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
      setUserdata({ id: "", username: "", isOnline: false });
      return;
    }
    console.log(user, "user found"); // Debugging line to check user data
    return user;
  };

  // given id set socketId for user
  const setSocketIdForUser = (id: string, socketId: string) => {
    setDummyUsers((prevUsers) =>
      prevUsers.map((user) => (user.id === id ? { ...user, socketId } : user))
    );
  };

  return (
    <UserContext.Provider
      value={{
        userdata,
        handleUserData: setUserdata,
        findUser,
        isLoggedIn,
        setIsLoggedIn,
        dummyUsers,
        setDummyUsers,
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
