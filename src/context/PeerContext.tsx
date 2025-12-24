import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { useUserContext } from "../hooks/useUser";

type PeerContextType = {
    peer: RTCPeerConnection | null;
    createOffer: () => Promise<RTCSessionDescriptionInit | undefined>;
    createAnswer: (
        offer: RTCSessionDescriptionInit
    ) => Promise<RTCSessionDescriptionInit | undefined>;
    setRemoteAns: (ans: RTCSessionDescriptionInit) => Promise<void>;
    addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
    sendStream: (stream: MediaStream) => Promise<void>;
    handleRemoteStream: (stream: MediaStream | null) => Promise<void>;
    remoteStream: MediaStream | null;
    assignNewPeer: () => void;
};

export const PeerContext = createContext<PeerContextType | null>(null);

export const PeerProvider = ({ children }: { children: React.ReactNode }) => {
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const { socketRef } = useSocket();
    const { userIdRef, roomIdRef } = useUserContext();
    const peerRef = useRef<RTCPeerConnection | null>(null);


    const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]).current;

    // Create peer connection once
    const createPeer = () => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" }
            ]
        });

        pc.onconnectionstatechange = () => {
            console.log("Connection state:", pc.connectionState);
        };

        pc.onicecandidate = (event) => {
            if (socketRef && event.candidate && socketRef.current) {
                socketRef.current.emit("ice-candidate", {
                    roomId: roomIdRef?.current,
                    userId: userIdRef?.current,
                    candidate: event.candidate.toJSON()
                });
            }
        };

        pc.ontrack = (ev) => {
            if (ev.streams[0]) {
                setRemoteStream(ev.streams[0]);
            }
        };

        return pc;
    };

    useEffect(() => {
        peerRef.current = createPeer();

        return () => {
            peerRef.current?.close();
            peerRef.current = null;
        };
    }, []);





    const assignNewPeer = () => {
        if (peerRef.current) {
            peerRef.current.ontrack = null;
            peerRef.current.onicecandidate = null;
            peerRef.current.close();
        }

        peerRef.current = createPeer();
        setRemoteStream(null);
    };

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
        if (!peerRef.current) return;
        console.log("event added for track");
        peerRef.current.addEventListener('track', handleTrackEvent);

        return () => {
            console.log("event cleaned");
            if (peerRef.current) peerRef.current.removeEventListener('track', handleTrackEvent);
        };
    }, [peerRef.current, handleTrackEvent]);


    // Send media stream to peer
    const sendStream = async (stream: MediaStream) => {
        const tracks = stream.getTracks();
        for (const track of tracks) {
            console.log(`➕ Adding ${track.kind} track to peer connection`);
            if (peerRef.current) peerRef.current.addTrack(track, stream);
        }
    };

    // Create offer
    const createOffer = async (): Promise<RTCSessionDescriptionInit | undefined> => {
        const offer = await peerRef.current?.createOffer();

        await peerRef.current?.setLocalDescription(offer);
        // ICE candidates will now start generating and trigger onicecandidate

        return offer;
    };

    // Create answer
    const createAnswer = async (
        offer: RTCSessionDescriptionInit
    ): Promise<RTCSessionDescriptionInit | undefined> => {
        if (peerRef.current)
            await peerRef.current.setRemoteDescription(offer);


        while (iceCandidateQueue.length > 0) {
            const candidate = iceCandidateQueue.shift();
            if (candidate) {
                await addIceCandidate(new RTCIceCandidate(candidate));
            }
        }
        const answer = await peerRef.current?.createAnswer();
        await peerRef.current?.setLocalDescription(answer);


        return answer;
    };

    // Set remote answer
    const setRemoteAns = async (ans: RTCSessionDescriptionInit) => {
        await peerRef.current?.setRemoteDescription(ans);

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
            if (peerRef.current?.remoteDescription) {
                await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
                iceCandidateQueue.push(candidate);
                console.log("✅ Ice candidate  added to queue");

            }
        } catch (error) {
            console.error("❌ Error adding ICE candidate:", error);
        }
    };

    return (
        <PeerContext.Provider
            value={{
                peer: peerRef.current,
                createOffer,
                createAnswer,
                setRemoteAns,
                addIceCandidate,
                sendStream,
                handleRemoteStream,
                remoteStream,
                assignNewPeer
            }}
        >
            {children}
        </PeerContext.Provider>
    );
};