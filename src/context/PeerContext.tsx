import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    sendStream: (stream: MediaStream) => Promise<void>;
    handleRemoteStream: (stream: MediaStream | null) => Promise<void>;
    remoteStream: MediaStream | null;
};

export const PeerContext = createContext<PeerContextType | null>(null);

export const PeerProvider = ({ children }: { children: React.ReactNode }) => {
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const { socketRef } = useSocket();
    const { userIdRef, roomIdRef } = useUserContext();

    const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]).current;

    // Create peer connection once
    const peer = useMemo(() => {
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" }
            ]
        });

        peerConnection.onconnectionstatechange = () => {
            console.log("->>>>>>>>>>>>>>>>>>>>>>>>>>connection state" + peerConnection.connectionState);
        }

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                if (socketRef?.current && userIdRef?.current && roomIdRef?.current) {
                    socketRef.current.emit("ice-candidate", {
                        roomId: roomIdRef?.current,
                        userId: userIdRef.current,
                        candidate: event.candidate.toJSON()
                    });
                } else {
                    console.warn("⚠️ Cannot send ICE candidate - missing context:", {
                        hasSocket: !!socketRef?.current,
                        userId: socketRef?.current || "null",
                        roomId: roomIdRef?.current,
                    });
                }
            } else {
                console.log(`🧊 ICE gathering complete (null candidate received) ${userIdRef?.current}`);
            }
        };

        return peerConnection;
    }, []);

    const handleRemoteStream = async (stream: MediaStream | null) => {
        setRemoteStream(stream);
    };



    const handleTrackEvent = useCallback((ev: RTCTrackEvent) => {
        const streams = ev.streams;
        console.log("->............handle track eventcalled ");
        if (streams && streams[0]) {
            console.log("✅ Setting remote stream");
            setRemoteStream(streams[0]);
        }
    }, []);

    // Handle track events
    useEffect(() => {
        if (!peer) return;
        console.log("event added for track");
        peer.addEventListener('track', handleTrackEvent);

        return () => {
            console.log("event cleaned");
            peer.removeEventListener('track', handleTrackEvent);
        };
    }, [peer, handleTrackEvent]);


    // Send media stream to peer
    const sendStream = async (stream: MediaStream) => {
        const tracks = stream.getTracks();
        for (const track of tracks) {
            console.log(`➕ Adding ${track.kind} track to peer connection`);
            peer.addTrack(track, stream);
        }
        console.log("✅ All tracks added to peer connection");
    };

    // Create offer
    const createOffer = async (): Promise<RTCSessionDescriptionInit> => {
        const offer = await peer.createOffer();

        await peer.setLocalDescription(offer);
        // ICE candidates will now start generating and trigger onicecandidate

        return offer;
    };

    // Create answer
    const createAnswer = async (
        offer: RTCSessionDescriptionInit
    ): Promise<RTCSessionDescriptionInit> => {
        await peer.setRemoteDescription(offer);

        while (iceCandidateQueue.length > 0) {
            const candidate = iceCandidateQueue.shift();
            if (candidate) {
                await addIceCandidate(new RTCIceCandidate(candidate));
            }
        }

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        return answer;
    };

    // Set remote answer
    const setRemoteAns = async (ans: RTCSessionDescriptionInit) => {
        await peer.setRemoteDescription(ans);

        while (iceCandidateQueue.length > 0) {
            console.log('length  not zero');
            const candidate = iceCandidateQueue.shift();
            if (candidate) {
                await addIceCandidate(new RTCIceCandidate(candidate));
            }
        }
    };

    // Add ICE candidate
    const addIceCandidate = async (candidate: RTCIceCandidateInit) => {
        try {
            if (peer.remoteDescription) {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
                iceCandidateQueue.push(candidate);
            }
        } catch (error) {
            console.error("❌ Error adding ICE candidate:", error);
        }
    };

    return (
        <PeerContext.Provider
            value={{
                peer,
                createOffer,
                createAnswer,
                setRemoteAns,
                addIceCandidate,
                sendStream,
                handleRemoteStream,
                remoteStream
            }}
        >
            {children}
        </PeerContext.Provider>
    );
};