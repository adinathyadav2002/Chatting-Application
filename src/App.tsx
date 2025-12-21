import Home from "./pages/Chats";
import { SocketProvider } from "./context/SocketContext";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { UserContextProvider } from "./context/UserContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NavigationBridge from "./components/NavigationBridge";
import { PeerProvider } from "./context/PeerContext";

function App() {
  return (
    <div className="App">
      <SocketProvider>
        <UserContextProvider>
          <PeerProvider>
            <BrowserRouter>
              <NavigationBridge />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Routes>
            </BrowserRouter>
          </PeerProvider>
        </UserContextProvider>
      </SocketProvider>
    </div >
  );
}

export default App;
