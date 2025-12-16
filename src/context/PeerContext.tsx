import { createContext, useMemo } from "react";

type PeerContextType = {
    peer: RTCPeerConnection;
    createOffer: () => Promise<RTCSessionDescriptionInit>;
    createAnswer: (
        offer: RTCSessionDescriptionInit
    ) => Promise<RTCSessionDescriptionInit>;
};

export const PeerContext = createContext<PeerContextType | null>(null);

export const PeerProvider = ({ children }: { children: React.ReactNode }) => {
    const peer = useMemo(() => new RTCPeerConnection(), []);

    const createOffer = async (): Promise<RTCSessionDescriptionInit> => {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        return offer;
    };

    const createAnswer = async (
        offer: RTCSessionDescriptionInit
    ): Promise<RTCSessionDescriptionInit> => {
        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        return answer;
    };

    // const

    return (
        <PeerContext.Provider value={{ peer, createOffer, createAnswer }}>
            {children}
        </PeerContext.Provider>
    );
};
