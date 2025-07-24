// NavigationBridge.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";
import { useLocation } from "react-router-dom";

const NavigationBridge = () => {
  const navigate = useNavigate();
  const { setNavigateFn } = useUserContext();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/login" && location.pathname !== "/register") {
      setNavigateFn(() => navigate); // set navigate function into context
    }
  }, [navigate]);

  return null;
};

export default NavigationBridge;
