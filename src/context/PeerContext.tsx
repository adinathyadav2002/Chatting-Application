import { createContext, useEffect, useMemo } from "react";
import { useSocket } from "../hooks/useSocket";
import { useUserContext } from "../hooks/useUser";

type PeerContextType = {
    peer: RTCPeerConnection;
    createOffer: () => Promise<RTCSessionDescriptionInit>;
    createAnswer: (
        offer: RTCSessionDescriptionInit
    ) => Promise<RTCSessionDescriptionInit>;
    setRemoteAns: (ans: RTCSessionDescriptionInit) => Promise<void>;
    addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
};

export const PeerContext = createContext<PeerContextType | null>(null);

export const PeerProvider = ({ children }: { children: React.ReactNode }) => {
    const { userdata, roomId } = useUserContext();
    const { socket } = useSocket();
    const peer = useMemo(
        () =>
            new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" }
                ]
            }),
        []
    );

    useEffect(() => {
        if (!socket || !peer) return;

        console.log("'fond per");
        // 1. Listen for ICE candidates from YOUR peer connection
        peer.onicecandidate = (event) => {

            if (event.candidate) {
                console.log("Sending ICE candidate to remote peer");
                // 2. Send YOUR candidate to the OTHER peer via socket
                socket.emit("ice-candidate", {
                    roomId: roomId,
                    userId: userdata.id,
                    candidate: event.candidate
                });
            }
        }
    },
        [socket, peer, roomId, userdata.id]
    );

    const createOffer = async (): Promise<RTCSessionDescriptionInit> => {
        console.log("🔵 createOffer() called");
        const offer = await peer.createOffer();
        console.log("🔵 Offer created:", offer);
        await peer.setLocalDescription(offer);
        console.log("🔵 Local description set, ICE gathering should start now");
        return offer;
    };

    const createAnswer = async (
        offer: RTCSessionDescriptionInit
    ): Promise<RTCSessionDescriptionInit> => {
        console.log("🟢 createAnswer() called");
        await peer.setRemoteDescription(offer);
        console.log("🟢 Remote description set");
        const answer = await peer.createAnswer();
        console.log("🟢 Answer created:", answer);
        await peer.setLocalDescription(answer);
        console.log("🟢 Local description set, ICE gathering should start now");
        return answer;
    };

    const setRemoteAns = async (ans: RTCSessionDescriptionInit) => {
        await peer.setRemoteDescription(ans);
    }

    const addIceCandidate = async (candidate: RTCIceCandidateInit) => {
        try {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error("Error adding ICE candidate:", error);
        }
    };

    return (
        <PeerContext.Provider value={{ peer, createOffer, createAnswer, setRemoteAns, addIceCandidate }}>
            {children}
        </PeerContext.Provider>
    );
};
