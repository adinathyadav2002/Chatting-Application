import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, User } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { usePeerContext } from '../hooks/usePeer';

export default function VideoCallingModal({ st, onChangeModal, handleVideoCallReponse, myStream, handleEndCall }: { st: "live" | "receiving" | "calling", onChangeModal: (modal: "receiving" | "off" | "calling" | "live") => void, handleVideoCallReponse: (response: "accept" | "reject") => void, myStream: MediaStream | null, handleEndCall: () => void }) {
    const [isMuted, setIsMuted] = useState(true);
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

        // Cleanup the event listener on component unmount
        return () => {
            window.removeEventListener('beforeunload', handleEndCall);
        };
    }, [socket]);

    // Socket listener
    useEffect(() => {
        if (!socket) return;

        socket.on("receiver accepted call", async (ans: RTCSessionDescriptionInit) => {
            await setRemoteAns(ans)
            onChangeModal("live");
        });

        return () => {
            socket.off("receiver accepted call");
        };
    }, [socket, setRemoteAns, onChangeModal]);

    // Start timer when call goes live
    useEffect(() => {
        if (st === "live") {
            timerIntervalRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            // Reset timer when not live
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
            setCallDuration(0);
        }

        // Cleanup timer when component unmounts or state changes
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, [st]);

    // Set local video stream (only once when myStream changes)
    useEffect(() => {
        if (!myStream || (st !== "live" && st != "calling")) return;

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = myStream;
        }
    }, [myStream, st]);

    useEffect(() => {
        if (myStream) {
            console.log("Local tracks:", myStream.getTracks());
        }
    }, [myStream]);




    // Set remote video stream (only once when remoteStream changes)
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        } else {
            console.log(`mystream not found ${remoteVideoRef.current} mystream  ${remoteStream}`);
        }
    }, [remoteStream]);

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
        <div className='w-screen h-screen fixed inset-0 z-50 flex items-center justify-center'>
            <div className="absolute inset-0 bg-linear-to-br from-black via-gray-900 to-black backdrop-blur-md"></div>

            <div className='w-full max-w-5xl mx-4 h-[90vh] md:h-auto md:max-h-[85vh] bg-linear-to-br from-black via-gray-900 to-black rounded-3xl flex flex-col overflow-hidden shadow-2xl relative border border-white/10'>

                {/* Video Area */}
                <div className='flex-1 relative bg-linear-to-br from-black to-gray-900 flex items-center justify-center p-2 md:p-6 rounded-t-3xl overflow-hidden'>
                    {/* Remote Video */}
                    <div className='w-full h-full flex items-center justify-center relative'>
                        <div className='flex flex-col items-center gap-3 md:gap-4 w-full h-full'>
                            <div className='w-full h-full rounded-2xl bg-linear-to-br from-gray-900 to-black flex items-center justify-center overflow-hidden shadow-inner relative border border-white/5'>
                                {remoteStream ? (
                                    <video
                                        ref={remoteVideoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className='flex flex-col items-center gap-4'>
                                        <div className='w-24 h-24 md:w-32 md:h-32 rounded-full bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-xl border-2 border-white/10'>
                                            <User className='w-12 h-12 md:w-16 md:h-16 text-gray-400' />
                                        </div>
                                        <div className='text-white text-lg md:text-xl font-semibold tracking-wide  p-4'>
                                            {st === "live" && "Connected"}
                                            {st === "receiving" && <div>
                                                receiving
                                            </div>}
                                            {st === "calling" && "Calling..."}
                                        </div>
                                        {st === "calling" && (
                                            <div className='text-gray-400 text-xs md:text-sm w-64'>
                                                <div>
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
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Local Video Preview (Small) */}
                    {st === "live" && (
                        <div className='absolute top-2 right-2 md:top-4 md:right-4 w-28 h-20 md:w-40 md:h-28 bg-gray-900 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10'>
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
                        <div className='absolute top-2 left-2 md:top-4 md:left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/20'>
                            <span className='text-white text-xs md:text-sm font-semibold tracking-wider'>
                                {formatTime(callDuration)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className='bg-linear-to-t from-black to-gray-900 p-4 md:p-6 flex items-center justify-center gap-3 md:gap-4 border-t border-white/10'>
                    {st === "receiving" ? (
                        <>
                            {/* Accept Call */}
                            <button
                                className='w-10 h-10 md:w-12 md:h-12 rounded-full bg-linear-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-green-500/30 hover:scale-105 active:scale-95 cursor-pointer'
                                onClick={() => handleVideoCallReponse("accept")}
                            >
                                <Phone className='w-5 h-5 md:w-6 md:h-6 text-white' />
                            </button>

                            {/* Decline Call */}
                            <button
                                className='w-10 h-10 md:w-12 md:h-12 rounded-full bg-linear-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-red-500/30 hover:scale-105 active:scale-95 cursor-pointer'
                                onClick={() => handleVideoCallReponse("reject")}
                            >
                                <PhoneOff className='w-5 h-5 md:w-6 md:h-6 text-white' />
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Mute Toggle */}
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={`w-8 h-8 md:w-10 md:h-10 rounded-full transition-all duration-300 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 ${isMuted
                                    ? 'bg-linear-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow-red-500/30'
                                    : 'bg-linear-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 cursor-pointer hover:shadow-gray-500/20 border border-white/10'
                                    }`}
                            >
                                {isMuted ? (
                                    <MicOff className='w-4 h-4 md:w-5 md:h-5 text-white' />
                                ) : (
                                    <Mic className='w-4 h-4 md:w-5 md:h-5 text-white' />
                                )}
                            </button>

                            {/* End Call */}
                            <button
                                className='w-10 h-10 md:w-12 md:h-12 rounded-full bg-linear-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-red-500/30 hover:scale-105 active:scale-95 cursor-pointer'
                                onClick={handleEndCall}
                            >
                                <PhoneOff className='w-5 h-5 md:w-6 md:h-6 text-white' />
                            </button>

                            {/* Video Toggle */}
                            <button
                                onClick={() => setIsVideoOff(!isVideoOff)}
                                className={`w-8 h-8 md:w-10 md:h-10 rounded-full transition-all duration-300 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 ${isVideoOff
                                    ? 'bg-linear-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow-red-500/30'
                                    : 'bg-linear-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 cursor-pointer hover:shadow-gray-500/20 border border-white/10'
                                    }`}
                            >
                                {isVideoOff ? (
                                    <VideoOff className='w-4 h-4 md:w-5 md:h-5 text-white' />
                                ) : (
                                    <Video className='w-4 h-4 md:w-5 md:h-5 text-white' />
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}