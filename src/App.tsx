import Home from "./pages/Home";
import { SocketProvider } from "./context/SocketContext";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { UserContextProvider } from "./context/UserContext";
import Login from "./pages/Login";

function App() {
  return (
    <div className="App">
      <UserContextProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/home" element={<Home />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </UserContextProvider>
    </div>
  );
}

export default App;
