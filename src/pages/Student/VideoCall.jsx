import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Peer from "simple-peer";

import {
  setCallStatus,
  setOffer,
  setAnswer,
  setPeerId,
  setRemotePeerId,
  clearVideoCall,
  addIceCandidate,
} from "../../redux/slices/videoSlice";
import ChatRoom from "./ChatRoom";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import bookedSocket from "../../socket/bookedSocket";
import { CameraIcon, MicrophoneIcon } from "@heroicons/react/24/outline";
import {
  CameraIcon as CameraSolidIcon,
  MicrophoneIcon as MicrophoneSolidIcon,
} from "@heroicons/react/24/solid";

export default function VideoCall({ roomId, user, booking }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { callStatus, offer, answer, remotePeerId, iceCandidates } = useSelector(
    (state) => state.video
  );
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isLocalStreamReady, setIsLocalStreamReady] = useState(false);

  // --- Initial Media Access and Socket Listeners ---
  useEffect(() => {
    if (!user?._id || !booking) return;

    // A. Get local media stream (CRITICAL: Needs both video and audio)
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        
        // Assign stream ONLY to local video element
        if (myVideo.current) {
            myVideo.current.srcObject = stream;
            myVideo.current.style.transform = 'scaleX(-1)';
        }

        setIsLocalStreamReady(true);
        dispatch(setCallStatus("ready"));
      })
      .catch((err) => {
        console.error("Failed to get media:", err);
        toast.error("Failed to access camera and microphone.");
        // Set status to idle if media access failed
        dispatch(setCallStatus("idle")); 
      });

    // B. Socket Listeners
    const handleIncomingCall = ({ signal, from, bookingId }) => {
      if (bookingId === booking._id && callStatus !== "connected") {
        dispatch(setCallStatus("receiving"));
        dispatch(setRemotePeerId(from));
        dispatch(setOffer(signal));
        toast.info("Incoming video call from the other party!");
      }
    };

    const handleCallAccepted = (signal) => {
      dispatch(setAnswer(signal));
      dispatch(setCallStatus("connected"));
      
      // CRITICAL: Initiator receives the answer signal
      if (connectionRef.current) connectionRef.current.signal(signal); 
    };

    // ICE candidates are handled directly in the peer.on('ice') handler below
    // but we also need a socket listener for remote candidates
    const handleRemoteIceCandidate = (candidate) => {
      if (connectionRef.current) {
        connectionRef.current.signal(candidate);
      } else {
        // If peer not ready, store in Redux for later
        dispatch(addIceCandidate(candidate)); 
      }
    };


    const handleCallEnded = () => {
      toast.info("The video call has ended.");
      if (connectionRef.current) connectionRef.current.destroy();
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
      if (remoteStreamRef.current) remoteStreamRef.current.getTracks().forEach(track => track.stop());
      dispatch(clearVideoCall());
    };

    bookedSocket.on("incomingCall", handleIncomingCall);
    bookedSocket.on("callAccepted", handleCallAccepted);
    bookedSocket.on("iceCandidate", handleRemoteIceCandidate); 
    bookedSocket.on("callEnded", handleCallEnded);

    return () => {
      bookedSocket.off("incomingCall", handleIncomingCall);
      bookedSocket.off("callAccepted", handleCallAccepted);
      bookedSocket.off("iceCandidate", handleRemoteIceCandidate);
      bookedSocket.off("callEnded", handleCallEnded);
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      if (remoteStreamRef.current) remoteStreamRef.current.getTracks().forEach(t => t.stop());
      dispatch(clearVideoCall());
    };
  }, [roomId, user, booking, dispatch, callStatus, navigate]); 

  useEffect(() => {
    if (!isLocalStreamReady || connectionRef.current) return;

    const createPeer = (initiator, currentOffer) => {
      const peer = new Peer({ 
          initiator, 
          trickle: true, 
          stream: localStreamRef.current, // Stream attached here
          // **CRITICAL: Added STUN/TURN servers**
          config: {
              iceServers: [
                  { urls: 'stun:stun.l.google.com:19302' },
                  { urls: 'stun:global.stun.twilio.com:3478' }
              ]
          }
      }); 

      peer.on("signal", (signalData) => {
        if (initiator) {
          // 1. CALLER: Offer generated, send it over socket
          dispatch(setOffer(signalData));
          bookedSocket.emit("callUser", {
            userToCall: remotePeerId,
            signalData: signalData, 
            from: user._id,
            bookingId: booking._id,
          });
        } else {
          // 2. RECEIVER: Answer generated, send it back
          dispatch(setAnswer(signalData));
          bookedSocket.emit("acceptCall", { to: remotePeerId, signal: signalData });
        }
      });

      peer.on("stream", (stream) => {
        // 3. Attach remote stream (audio/video)
        remoteStreamRef.current = stream;
        if (userVideo.current) {
            userVideo.current.srcObject = stream;
            userVideo.current.muted = false; // Enable remote audio
        }
      });
      
      // 4. Send local ICE candidates to remote peer (Trickle)
      peer.on("ice", (candidate) => {
        bookedSocket.emit("iceCandidate", { to: remotePeerId, candidate: candidate });
      });

      peer.on("close", () => {
        dispatch(clearVideoCall());
        navigate("/dashboard");
      });

      peer.on("error", (err) => {
        console.error("Peer error:", err);
        dispatch(clearVideoCall());
        toast.error("Video call error. Ending session.");
      });

      connectionRef.current = peer;

      // CRITICAL STEP FOR RECEIVER: Kickstart negotiation by signaling the received offer
      if (!initiator && currentOffer) {
          peer.signal(currentOffer);
      }
    };

    // A. CALLER LOGIC: Initialize call
    if (callStatus === "ready" && remotePeerId && !connectionRef.current) {
      createPeer(true, null); // Initiator, no offer yet
      dispatch(setCallStatus("calling"));
    }

    // B. RECEIVER LOGIC: Respond to call
    if (callStatus === "receiving" && offer && !connectionRef.current) {
      createPeer(false, offer); // Receiver, pass the Redux offer directly
      dispatch(setCallStatus("connected")); // Set status once peer is ready
    }

    // C. Handle queued ICE Candidates
    if (connectionRef.current && iceCandidates.length > 0) {
      iceCandidates.forEach(candidate => connectionRef.current.signal(candidate));
    }
  }, [callStatus, isLocalStreamReady, offer, remotePeerId, user, booking, dispatch, iceCandidates, navigate]);

  const toggleCamera = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
    }
  };

  const toggleMicrophone = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  return (
  <div className="flex flex-col md:flex-row h-screen w-full gap-2 p-2 md:p-4 bg-gray-100 dark:bg-gray-800">
    {/* Video Section */}
    <div className="flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-xl p-2 md:p-4 flex-[2] min-h-[300px] md:min-h-[500px]">
      <div className="flex flex-col w-full h-full gap-2">
        {/* Local Video */}
        <div className="relative w-full h-1/2">
          <video
            ref={myVideo}
            playsInline
            muted
            autoPlay
            className="w-full h-full rounded-lg bg-black object-cover transform scale-x-[-1]"
          />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 px-2 py-1 rounded-full shadow-lg">
            <button
              onClick={toggleCamera}
              className="p-2 rounded-full bg-white text-gray-800 dark:bg-gray-700 dark:text-white hover:bg-gray-200 transition"
            >
              {isCameraOn ? <CameraSolidIcon className="h-5 w-5" /> : <CameraIcon className="h-5 w-5" />}
            </button>
            <button
              onClick={toggleMicrophone}
              className="p-2 rounded-full bg-white text-gray-800 dark:bg-gray-700 dark:text-white hover:bg-gray-200 transition"
            >
              {isMicOn ? <MicrophoneSolidIcon className="h-5 w-5" /> : <MicrophoneIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Remote Video */}
        <div className="relative w-full h-1/2">
          <video
            ref={userVideo}
            playsInline
            autoPlay
            className="w-full h-full rounded-lg bg-black object-cover"
          />
        </div>
      </div>
    </div>

    {/* Chat Section */}
    <div className="flex-1 md:flex-[1] min-h-[200px] md:min-h-[500px]">
      <ChatRoom roomId={roomId} user={user} booking={booking} />
    </div>
  </div>
);}