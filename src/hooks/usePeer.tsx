import { useContext } from "react";
import { PeerContext } from "../context/PeerContext";

export const usePeerContext = () => {
    const context = useContext(PeerContext);
    if (!context) {
        throw new Error("peerContext must be used within a PeerProvider");
    }
    return context;
}