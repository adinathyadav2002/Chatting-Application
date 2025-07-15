import Home from "./pages/Home";
import { SocketProvider } from "./context/SocketContext";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { UserContextProvider } from "./context/UserContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NavigationBridge from "./components/NavigationBridge";

function App() {
  return (
    <div className="App">
      <SocketProvider>
        <UserContextProvider>
          <BrowserRouter>
            <NavigationBridge />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </BrowserRouter>
        </UserContextProvider>
      </SocketProvider>
    </div>
  );
}

export default App;
