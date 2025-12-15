import { createContext, useMemo } from "react";

export const PeerContext = createContext<{ peer: RTCPeerConnection, createOffer: () => void } | null>(null);


export const PeerProvider = ({ children }: { children: React.ReactNode }) => {
    const peer = useMemo(() => new RTCPeerConnection(), []);

    const createOffer = async () => {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        return offer;
    }

    return <PeerContext.Provider value={{ peer, createOffer }}>
        {children}
    </PeerContext.Provider>
}