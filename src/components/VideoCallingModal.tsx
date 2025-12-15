import React from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, User } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { useUserContext } from '../hooks/useUser';

export default function VideoCallingModal({ st, onChangeModal, roomId }: { st: "live" | "receiving" | "calling", onChangeModal: (modal: "receiving" | "off" | "calling" | "live") => void, roomId: string }) {
    const [isMuted, setIsMuted] = React.useState(false);
    const [isVideoOff, setIsVideoOff] = React.useState(false);
    const { socket } = useSocket();
    const { userdata } = useUserContext();

    const handleVideoCallReponse = async (response: "accept" | "reject") => {
        if (!socket) {
            return;
        }

        if (response == "accept") {
            socket.emit("receive video call", userdata.id, roomId);
            onChangeModal("live");
        }

        if (response == "reject") {
            socket.emit("reject video call", userdata.id, roomId);
        }
    }

    return (
        <div className='w-screen h-screen absolute inset-0 z-50'>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

            <div className='w-full max-w-4xl h-3/4 bg-gray-900 rounded-2xl flex flex-col overflow-hidden shadow-2xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>

                {/* Video Area */}
                <div className='flex-1 relative bg-gray-800 flex items-center justify-center'>
                    {/* Remote Video Placeholder */}
                    <div className='w-full h-full flex items-center justify-center'>
                        <div className='flex flex-col items-center gap-4'>
                            <div className='w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center'>
                                <User className='w-16 h-16 text-gray-400' />
                            </div>
                            <div className='text-white text-xl font-medium'>
                                {st === "live" && "Connected"}
                                {st === "receiving" && "Incoming Call..."}
                                {st === "calling" && "Calling..."}
                            </div>
                            {st === "calling" && (
                                <div className='text-gray-400 text-sm'>Waiting for response</div>
                            )}
                        </div>
                    </div>

                    {/* Local Video Preview (Small) */}
                    {st === "live" && (
                        <div className='absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden shadow-lg border-2 border-gray-600'>
                            <div className='w-full h-full flex items-center justify-center'>
                                <User className='w-12 h-12 text-gray-500' />
                            </div>
                        </div>
                    )}

                    {/* Call Duration (Live only) */}
                    {st === "live" && (
                        <div className='absolute top-4 left-4 bg-black/50 px-4 py-2 rounded-full'>
                            <span className='text-white text-sm font-medium'>00:00</span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className='bg-gray-900 p-6 flex items-center justify-center gap-4'>
                    {st === "receiving" ? (
                        <>
                            {/* Accept Call */}
                            <button className='w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center shadow-lg  cursor-pointer' onClick={() => handleVideoCallReponse("accept")}>
                                <Phone className='w-7 h-7 text-white' />
                            </button>

                            {/* Decline Call */}
                            <button className='w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg cursor-pointer' onClick={() => handleVideoCallReponse("reject")}>
                                <PhoneOff className='w-7 h-7 text-white' />
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Mute Toggle */}
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={`w-14 h-14 rounded-full transition-colors flex items-center justify-center ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600 cursor-pointer'
                                    }`}
                            >
                                {isMuted ? (
                                    <MicOff className='w-6 h-6 text-white' />
                                ) : (
                                    <Mic className='w-6 h-6 text-white' />
                                )}
                            </button>

                            {/* End Call */}
                            <button className='w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg cursor-pointer' onClick={() => onChangeModal("off")}>
                                <PhoneOff className='w-7 h-7 text-white' />
                            </button>

                            {/* Video Toggle */}
                            <button
                                onClick={() => setIsVideoOff(!isVideoOff)}
                                className={`w-14 h-14 rounded-full transition-colors flex items-center justify-center ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600 cursor-pointer'
                                    }`}
                            >
                                {isVideoOff ? (
                                    <VideoOff className='w-6 h-6 text-white' />
                                ) : (
                                    <Video className='w-6 h-6 text-white' />
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}