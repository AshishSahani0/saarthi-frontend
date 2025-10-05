// src/components/VideoCall.jsx

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Peer from "simple-peer";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import {
  setCallStatus,
  setOffer,
  setAnswer,
  setRemotePeerId,
  clearVideoCall,
  addIceCandidate,
} from "../../redux/slices/videoSlice";

import ChatRoom from "./ChatRoom";
import bookedSocket from "../../socket/bookedSocket";

import { CameraIcon, MicrophoneIcon } from "@heroicons/react/24/outline";
import {
  CameraIcon as CameraSolidIcon,
  MicrophoneIcon as MicrophoneSolidIcon,
} from "@heroicons/react/24/solid";

// --- FINAL, EXTENDED STUN/TURN CONFIGURATION ---
const EXTENDED_ICE_SERVERS = [
    // Google STUN Servers (Reliable STUN)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Twilio STUN/TURN (Reliable, often requires authentication)
    { urls: 'stun:global.stun.twilio.com:3478' },
    
    // Public TURN Relay Server (CRITICAL FOR SYMMETRIC NAT/FIREWALLS)
    // NOTE: Free credentials can be unstable/unreliable, but worth trying
    {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelay@metered.ca',
        credential: 'openrelaypassword'
    },
    // Another popular public STUN server
    { urls: 'stun:stun.ekiga.net' },
    { urls: 'stun:stun.voipbuster.com' },
];
// ------------------------------------------------

export default function VideoCall({ roomId, user, booking }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { callStatus, offer, remotePeerId, iceCandidates } = useSelector(
    (state) => state.video
  );

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isLocalReady, setIsLocalReady] = useState(false);


  // --- Cleanup helper (Ensures full stop) ---
  const cleanupCall = () => {
    console.log("🧹 Cleaning up...");
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {
        console.warn("Error destroying peer:", e);
      }
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    // No need to stop remoteStreamRef tracks here, as destroy() should handle it
    dispatch(clearVideoCall());
  };


  // Acquire local media & set up socket listeners
  useEffect(() => {
    if (!user?._id || !booking) return;

    // Setup logic (same as previous working version)
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
          myVideo.current.muted = true;
          myVideo.current.play().catch((err) => console.warn("🎥 myVideo.play() error:", err.message));
        }
        setIsLocalReady(true);
        dispatch(setCallStatus("ready"));
      })
      .catch((err) => {
        console.error("❌ Media error (camera/mic blocked?):", err);
        toast.error("Cannot access camera or microphone.");
        dispatch(setCallStatus("idle"));
      });

    // Socket listeners remain unchanged
    const onCallOffer = (signal, fromPeerId, bookingId) => {
      if (bookingId === booking._id && peerRef.current === null) { // Added check for no existing peer
        console.log("📩 callOffer received", { fromPeerId, signal });
        dispatch(setRemotePeerId(fromPeerId));
        dispatch(setOffer(signal));
        dispatch(setCallStatus("receiving"));
        toast.info("Incoming video call...");
      }
    };
    // ... (omitted other listeners)

    const onCallAnswer = (signal) => {
      console.log("📩 callAnswer received", signal);
      dispatch(setAnswer(signal));
      dispatch(setCallStatus("connected"));
      if (peerRef.current) {
        peerRef.current.signal(signal);
      }
    };

    const onIce = (candidate) => {
      console.log("📩 iceCandidate received", candidate);
      if (peerRef.current) {
        peerRef.current.signal(candidate);
      } else {
        dispatch(addIceCandidate(candidate));
      }
    };

    const onCallEnd = () => {
      console.log("📩 callEnded received");
      cleanupCall();
      toast.info("Call ended by remote");
    };
    
    // Attach socket listeners
    bookedSocket.on("callOffer", onCallOffer);
    bookedSocket.on("callAnswer", onCallAnswer);
    bookedSocket.on("iceCandidate", onIce);
    bookedSocket.on("callEnded", onCallEnd);

    return () => {
      bookedSocket.off("callOffer", onCallOffer);
      bookedSocket.off("callAnswer", onCallAnswer);
      bookedSocket.off("iceCandidate", onIce);
      bookedSocket.off("callEnded", onCallEnd);
      cleanupCall();
    };
  }, [user, booking, dispatch, remotePeerId]);

  // Setup peer when local is ready or signaling state changes
  useEffect(() => {
    if (!isLocalReady || !remotePeerId || peerRef.current) return;

    console.log("🎬 Setting up peer connection...");

    const setupPeer = (isInitiator, receivedOffer = null) => {
      const peer = new Peer({
        initiator: isInitiator,
        trickle: true,
        stream: null, // CRITICAL: Peer created without stream
        config: {
          iceServers: EXTENDED_ICE_SERVERS, // USE EXTENDED SERVERS
        },
        offerOptions: {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        },
      });

      // **CRITICAL: Manually add tracks immediately**
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          peer.addTrack(track, localStreamRef.current);
        });
        console.log("✅ Local tracks added to peer.");
      }

      peer.on("signal", (signalData) => {
        if (isInitiator) {
          dispatch(setOffer(signalData));
          bookedSocket.emit("callUser", {
            userToCall: remotePeerId,
            signalData,
            from: user._id,
            bookingId: booking._id,
          });
        } else {
          dispatch(setAnswer(signalData));
          bookedSocket.emit("acceptCall", {
            to: remotePeerId,
            signal: signalData,
          });
        }
      });

      peer.on("stream", (remoteStream) => {
        console.log("📺 Remote stream received");
        if (userVideo.current) {
          userVideo.current.srcObject = remoteStream;
          userVideo.current.muted = false; 
          userVideo.current.onloadedmetadata = () => {
            userVideo.current.play().catch((err) => {
              console.warn("🎥 userVideo.play() error:", err.message);
            });
          };
        }
      });

      // Note: peer.on('ice') is automatically handled by the peer instance and sent via socket.emit('iceCandidate')

      peer.on("close", () => {
        cleanupCall();
        navigate("/dashboard");
      });

      peer.on("error", (err) => {
        console.error("❌ Peer error:", err);
        toast.error("Peer connection error");
        cleanupCall();
      });

      peerRef.current = peer;

      // If Receiver, apply the offer
      if (callStatus === "receiving" && !isInitiator && receivedOffer) {
        peer.signal(receivedOffer);
      }
    };

    // --- Signaling State Triggers ---

    // Caller scenario: Ready to initiate a call
    if (callStatus === "ready" && remotePeerId) {
      setupPeer(true, null);
      dispatch(setCallStatus("calling"));
    }

    // Receiver scenario: Received the offer and is ready to answer
    if (callStatus === "receiving" && offer) {
      setupPeer(false, offer);
      dispatch(setCallStatus("connected"));
    }

    // Signal queued ICE candidates (handles candidates received before peer creation)
    if (peerRef.current && iceCandidates.length > 0) {
      console.log("📩 Applying queued ICE candidates");
      iceCandidates.forEach((cand) => {
        peerRef.current.signal(cand);
      });
    }
  }, [
    isLocalReady,
    callStatus,
    remotePeerId,
    offer,
    iceCandidates,
    dispatch,
    navigate,
    user,
    booking,
  ]);

  // --- UI Controls (omitted) ---
  const toggleCamera = () => { /* ... */ };
  const toggleMic = () => { /* ... */ };
  // ... cleanupCall is defined above

  return (
    <div className="flex flex-col md:flex-row h-screen w-full gap-2 p-2 md:p-4 bg-gray-100 dark:bg-gray-800">
      {/* Video panel */}
      <div className="flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-xl p-2 md:p-4 flex-[2] min-h-[300px] md:min-h-[500px]">
        <div className="flex flex-col w-full h-full gap-2">
          {/* Local Video */}
          <div className="relative w-full h-1/2">
            <video
              ref={myVideo}
              autoPlay
              playsInline
              muted
              className="w-full h-full rounded-lg bg-black object-cover transform scale-x-[-1]"
            />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 px-2 py-1 rounded-full shadow-lg">
              <button
                onClick={toggleCamera}
                className="p-2 rounded-full bg-white text-gray-800 dark:bg-gray-700 dark:text-white hover:bg-gray-200 transition"
              >
                {isCameraOn ? (
                  <CameraSolidIcon className="h-5 w-5" />
                ) : (
                  <CameraIcon className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={toggleMic}
                className="p-2 rounded-full bg-white text-gray-800 dark:bg-gray-700 dark:text-white hover:bg-gray-200 transition"
              >
                {isMicOn ? (
                  <MicrophoneSolidIcon className="h-5 w-5" />
                ) : (
                  <MicrophoneIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <div className="relative w-full h-1/2">
            <video
              ref={userVideo}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full rounded-lg bg-black object-cover"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 md:flex-[1] min-h-[200px] md:min-h-[500px]">
        <ChatRoom roomId={roomId} user={user} booking={booking} />
      </div>
    </div>
  );
}