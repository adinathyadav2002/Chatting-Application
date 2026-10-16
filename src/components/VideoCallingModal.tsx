import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, User } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { usePeerContext } from '../hooks/usePeer';
import type { Message } from '../types';

export default function VideoCallingModal({ st, onChangeModal, handleVideoCallReponse, myStream, handleEndCall }: {
    st: "live" | "receiving" | "calling", onChangeModal: (modal: "receiving" | "off" | "calling" | "live") => void, handleVideoCallReponse: (response: "accept" | "reject") => void, myStream: MediaStream | null, handleEndCall: () => void

}) {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    const { socket } = useSocket();
    const { setRemoteAns, remoteStream } = usePeerContext();
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        // Add event listener for beforeunload
        window.addEventListener('beforeunload', handleEndCall);

        return () => {
            window.removeEventListener('beforeunload', handleEndCall);
        };
    }, [handleEndCall]);

    // Socket listener for answer
    useEffect(() => {
        if (!socket) return;

        const handleAccepted = async (ans: RTCSessionDescriptionInit) => {
            await setRemoteAns(ans);
            onChangeModal("live");
        };

        socket.on("receiver accepted call", handleAccepted);

        return () => {
            socket.off("receiver accepted call", handleAccepted);
        };
    }, [socket, setRemoteAns, onChangeModal]);

    // Start timer when call goes live
    useEffect(() => {
        if (st === "live") {
            timerIntervalRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
            setCallDuration(0);
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, [st]);

    // Set local video stream
    useEffect(() => {
        if (!myStream || (st !== "live" && st !== "calling")) return;

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = myStream;
            localVideoRef.current.play().catch(e => console.warn("Local video play warning:", e));
        }
    }, [myStream, st]);

    // Set remote video stream
    useEffect(() => {
        const videoEl = remoteVideoRef.current;
        if (!videoEl || !remoteStream) return;

        console.log("📺 Setting remoteVideoRef.srcObject with tracks:", remoteStream.getTracks());
        videoEl.srcObject = remoteStream;

        const playVideo = () => {
            videoEl.play().catch(e => {
                console.warn("Autoplay was prevented by browser, retrying muted:", e);
                videoEl.muted = true;
                videoEl.play().catch(err => console.error("Video play failed:", err));
            });
        };

        videoEl.onloadedmetadata = () => {
            console.log("📺 Remote video metadata loaded, playing video");
            playVideo();
        };

        playVideo();
    }, [remoteStream, st]);

    // Toggle mute functionality
    useEffect(() => {
        if (myStream) {
            myStream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
    }, [isMuted, myStream]);

    // Toggle video functionality
    useEffect(() => {
        if (myStream) {
            myStream.getVideoTracks().forEach(track => {
                track.enabled = !isVideoOff;
            });
        }
    }, [isVideoOff, myStream]);

    return (
        <div className='w-full h-full fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4'>
            <div className="absolute inset-0 bg-black/90 md:bg-black/80 backdrop-blur-md"></div>

            <div className='w-full h-full md:h-auto md:max-w-5xl md:max-h-[85vh] bg-linear-to-br from-black via-gray-900 to-black rounded-none md:rounded-3xl flex flex-col overflow-hidden shadow-2xl relative border-0 md:border md:border-white/10'>

                {/* Video Area */}
                <div className='flex-1 relative bg-linear-to-br from-black to-gray-900 flex items-center justify-center p-2 sm:p-4 md:p-6 rounded-none md:rounded-t-3xl overflow-hidden'>
                    {/* Remote Video */}
                    <div className='w-full h-full flex items-center justify-center relative'>
                        <div className='flex flex-col items-center gap-3 md:gap-4 w-full h-full'>
                            <div className='w-full h-full rounded-xl md:rounded-2xl bg-linear-to-br from-gray-900 to-black flex items-center justify-center overflow-hidden shadow-inner relative border border-white/5'>
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className={`w-full h-full object-cover ${st === "live" ? "block" : "hidden"}`}
                                />
                                {st !== "live" && (
                                    <div className='flex flex-col items-center gap-4 px-4 text-center'>
                                        <div className='w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-xl border-2 border-white/10'>
                                            <User className='w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-gray-400' />
                                        </div>
                                        <div className='text-white text-base sm:text-lg md:text-xl font-semibold tracking-wide'>
                                            {st === "live" && "Connecting video..."}
                                            {st === "receiving" && "Incoming Video Call..."}
                                            {st === "calling" && "Calling..."}
                                        </div>
                                        {st === "calling" && (
                                            <div className='text-gray-400 text-xs md:text-sm w-48 sm:w-64 aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/50 flex items-center justify-center mt-2'>
                                                {myStream && !isVideoOff ? (
                                                    <video
                                                        ref={localVideoRef}
                                                        autoPlay
                                                        muted
                                                        playsInline
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <User className='w-8 h-8 md:w-12 md:h-12 text-gray-400' />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Local Video Preview (Small) */}
                    {st === "live" && (
                        <div className='absolute top-3 right-3 sm:top-4 sm:right-4 w-24 h-32 sm:w-32 sm:h-24 md:w-44 md:h-32 bg-gray-900 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-10'>
                            <div className='w-full h-full flex items-center justify-center'>
                                {myStream && !isVideoOff ? (
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className='w-8 h-8 md:w-12 md:h-12 text-gray-400' />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Call Duration (Live only) */}
                    {st === "live" && (
                        <div className='absolute top-3 left-3 sm:top-4 sm:left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/20 z-10'>
                            <span className='text-white text-xs md:text-sm font-semibold tracking-wider'>
                                {formatTime(callDuration)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className='bg-linear-to-t from-black via-gray-950 to-gray-900/95 p-4 sm:p-5 md:p-6 flex items-center justify-center gap-4 sm:gap-6 border-t border-white/10'>
                    {st === "receiving" ? (
                        <>
                            {/* Accept Call */}
                            <button
                                className='w-12 h-12 md:w-14 md:h-14 rounded-full bg-linear-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-green-500/30 hover:scale-105 active:scale-95 cursor-pointer'
                                onClick={() => handleVideoCallReponse("accept")}
                                aria-label="Accept Call"
                            >
                                <Phone className='w-6 h-6 text-white' />
                            </button>

                            {/* Decline Call */}
                            <button
                                className='w-12 h-12 md:w-14 md:h-14 rounded-full bg-linear-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-red-500/30 hover:scale-105 active:scale-95 cursor-pointer'
                                onClick={() => handleVideoCallReponse("reject")}
                                aria-label="Decline Call"
                            >
                                <PhoneOff className='w-6 h-6 text-white' />
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Mute Toggle */}
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={`w-11 h-11 md:w-12 md:h-12 rounded-full transition-all duration-300 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 cursor-pointer ${isMuted
                                    ? 'bg-linear-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow-red-500/30'
                                    : 'bg-linear-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 hover:shadow-gray-500/20 border border-white/10'
                                    }`}
                                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                            >
                                {isMuted ? (
                                    <MicOff className='w-5 h-5 text-white' />
                                ) : (
                                    <Mic className='w-5 h-5 text-white' />
                                )}
                            </button>

                            {/* End Call */}
                            <button
                                className='w-12 h-12 md:w-14 md:h-14 rounded-full bg-linear-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-red-500/30 hover:scale-105 active:scale-95 cursor-pointer'
                                onClick={handleEndCall}
                                aria-label="End call"
                            >
                                <PhoneOff className='w-6 h-6 text-white' />
                            </button>

                            {/* Video Toggle */}
                            <button
                                onClick={() => setIsVideoOff(!isVideoOff)}
                                className={`w-11 h-11 md:w-12 md:h-12 rounded-full transition-all duration-300 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 cursor-pointer ${isVideoOff
                                    ? 'bg-linear-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow-red-500/30'
                                    : 'bg-linear-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 hover:shadow-gray-500/20 border border-white/10'
                                    }`}
                                aria-label={isVideoOff ? "Turn on camera" : "Turn off camera"}
                            >
                                {isVideoOff ? (
                                    <VideoOff className='w-5 h-5 text-white' />
                                ) : (
                                    <Video className='w-5 h-5 text-white' />
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}