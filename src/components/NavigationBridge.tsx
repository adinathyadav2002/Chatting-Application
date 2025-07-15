// NavigationBridge.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";

const NavigationBridge = () => {
  const navigate = useNavigate();
  const { setNavigateFn } = useUserContext();

  useEffect(() => {
    setNavigateFn(() => navigate); // set navigate function into context
  }, [navigate]);

  return null;
};

export default NavigationBridge;
