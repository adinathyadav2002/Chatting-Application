import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, User } from "lucide-react";
import { useSocket } from "../hooks/useSocket";
import { usePeerContext } from "../hooks/usePeer";

interface VideoCallingModalProps {
  st: "live" | "receiving" | "calling";
  onChangeModal: (modal: "receiving" | "off" | "calling" | "live") => void;
  handleVideoCallReponse: (response: "accept" | "reject") => void;
  myStream: MediaStream | null;
  handleEndCall: () => void;
  userName?: string;
  userAvatar?: string;
}

export default function VideoCallingModal({
  st,
  onChangeModal,
  handleVideoCallReponse,
  myStream,
  handleEndCall,
  userName,
  userAvatar,
}: VideoCallingModalProps) {
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
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    window.addEventListener("beforeunload", handleEndCall);
    return () => {
      window.removeEventListener("beforeunload", handleEndCall);
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
        setCallDuration((prev) => prev + 1);
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
      localVideoRef.current
        .play()
        .catch((e) => console.warn("Local video play warning:", e));
    }
  }, [myStream, st]);

  // Set remote video stream
  useEffect(() => {
    const videoEl = remoteVideoRef.current;
    if (!videoEl || !remoteStream) return;

    videoEl.srcObject = remoteStream;

    const playVideo = () => {
      videoEl.play().catch((e) => {
        console.warn("Autoplay was prevented by browser, retrying muted:", e);
        videoEl.muted = true;
        videoEl.play().catch((err) => console.error("Video play failed:", err));
      });
    };

    videoEl.onloadedmetadata = () => {
      playVideo();
    };

    playVideo();
  }, [remoteStream, st]);

  // Toggle mute functionality
  useEffect(() => {
    if (myStream) {
      myStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, myStream]);

  // Toggle video functionality
  useEffect(() => {
    if (myStream) {
      myStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff, myStream]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-zinc-950/90 backdrop-blur-xl">
      {/* Main Calling Stage Container */}
      <div className="relative w-full h-full md:max-w-6xl md:h-[88vh] md:rounded-3xl overflow-hidden bg-black border-0 md:border md:border-white/10 shadow-2xl flex flex-col select-none">
        {/* Top Info Bar */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 flex items-center gap-3">
          {st === "live" ? (
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/10 text-xs sm:text-sm font-medium text-white shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{formatTime(callDuration)}</span>
              {userName && (
                <span className="text-zinc-400 font-normal">| {userName}</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/10 text-xs sm:text-sm font-medium text-zinc-300 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>{st === "calling" ? "Connecting..." : "Incoming Call"}</span>
            </div>
          )}
        </div>

        {/* Video Canvas Area */}
        <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-zinc-950">
          {/* Remote Video Stream (Always mounted in DOM) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              st === "live" ? "opacity-100 block" : "opacity-0 hidden"
            }`}
          />

          {/* Calling / Receiving Center Card */}
          {st !== "live" && (
            <div className="flex flex-col items-center justify-center text-center px-4 z-20">
              {/* Ripple Animation around Avatar */}
              <div className="relative flex items-center justify-center mb-6">
                <span className="absolute w-36 h-36 md:w-44 md:h-44 rounded-full bg-blue-500/10 animate-ping duration-1000" />
                <span className="absolute w-28 h-28 md:w-36 md:h-36 rounded-full bg-blue-500/20 animate-pulse" />
                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-zinc-900 border-2 border-white/15 flex items-center justify-center shadow-2xl text-4xl">
                  {userAvatar ? (
                    <span>{userAvatar}</span>
                  ) : (
                    <User className="w-12 h-12 text-zinc-300" />
                  )}
                </div>
              </div>

              {/* Title & Status */}
              <h2 className="text-xl md:text-2xl font-semibold text-white tracking-wide">
                {userName || (st === "calling" ? "Calling..." : "Incoming Video Call")}
              </h2>
              <p className="text-sm text-zinc-400 mt-1.5 flex items-center justify-center gap-1.5">
                {st === "calling" ? (
                  <>
                    <span>Ringing</span>
                    <span className="inline-flex gap-0.5">
                      <span
                        className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </span>
                  </>
                ) : (
                  "Incoming video call from stranger..."
                )}
              </p>
            </div>
          )}

          {/* Floating Picture-in-Picture (PiP) Self-View */}
          {(st === "live" || st === "calling") && (
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 w-28 h-40 sm:w-36 sm:h-48 md:w-48 md:h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-zinc-900 z-30 transition-all duration-300">
              {myStream && !isVideoOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover -scale-x-100"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-zinc-900 text-zinc-500">
                  <VideoOff className="w-6 h-6 md:w-8 md:h-8" />
                  <span className="text-[11px] font-medium">Camera Off</span>
                </div>
              )}
              {/* PiP badge */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-medium text-white flex items-center gap-1">
                <span>You</span>
                {isMuted && <span className="text-rose-400 font-bold">• Muted</span>}
              </div>
            </div>
          )}
        </div>

        {/* Floating Bottom Control Dock */}
        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-3.5 md:gap-5 px-5 py-3 md:px-6 md:py-3.5 rounded-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
            {st === "receiving" ? (
              <>
                {/* Accept Call Button */}
                <button
                  onClick={() => handleVideoCallReponse("accept")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
                >
                  <Phone className="w-4 h-4 fill-current" />
                  <span>Accept</span>
                </button>

                {/* Decline Call Button */}
                <button
                  onClick={() => handleVideoCallReponse("reject")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm shadow-lg shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Decline</span>
                </button>
              </>
            ) : (
              <>
                {/* Mute Toggle */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                    isMuted
                      ? "bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-white/10"
                  }`}
                  title={isMuted ? "Unmute microphone" : "Mute microphone"}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* End Call Button */}
                <button
                  onClick={handleEndCall}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
                  title="End Call"
                >
                  <PhoneOff className="w-5 h-5 md:w-6 md:h-6" />
                </button>

                {/* Camera Toggle */}
                <button
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                    isVideoOff
                      ? "bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-white/10"
                  }`}
                  title={isVideoOff ? "Turn on camera" : "Turn off camera"}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}