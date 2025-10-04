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

export default function VideoCall({ roomId, user, booking }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { callStatus, offer, answer, remotePeerId, iceCandidates } = useSelector(
    (state) => state.video
  );

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isLocalReady, setIsLocalReady] = useState(false);

  // Acquire local media & set up socket listeners
  useEffect(() => {
    if (!user?._id || !booking) return;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
          myVideo.current.style.transform = "scaleX(-1)";
        }
        setIsLocalReady(true);
        dispatch(setCallStatus("ready"));
      })
      .catch((err) => {
        console.error("Media error:", err);
        toast.error("Cannot access camera or microphone.");
        dispatch(setCallStatus("idle"));
      });

    const onCallOffer = (signal, fromPeerId, bookingId) => {
      console.log("📩 onCallOffer", { signal, fromPeerId, bookingId });
      // Make sure this offer is for this booking context
      if (bookingId === booking._id) {
        dispatch(setRemotePeerId(fromPeerId));
        dispatch(setOffer(signal));
        dispatch(setCallStatus("receiving"));
        toast.info("Incoming video call...");
      }
    };
    const onCallAnswer = (signal) => {
      console.log("📩 onCallAnswer", signal);
      dispatch(setAnswer(signal));
      dispatch(setCallStatus("connected"));
      if (peerRef.current) {
        peerRef.current.signal(signal);
      }
    };
    const onIce = (candidate) => {
      console.log("📩 onIceCandidate (socket)", candidate);
      dispatch(addIceCandidate(candidate));
    };
    const onCallEnd = () => {
      console.log("📩 onCallEnded");
      cleanupCall();
      toast.info("Call ended by remote");
    };

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
  }, [user, booking, dispatch]);

  // Setup peer when local is ready or signaling state changes
  useEffect(() => {
    if (!isLocalReady || peerRef.current) {
      return;
    }

    const setupPeer = (isInitiator, receivedOffer = null) => {
      console.log("🔧 setupPeer", { isInitiator, receivedOffer });

      const peer = new Peer({
        initiator: isInitiator,
        trickle: true,
        stream: localStreamRef.current,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" },
            // Add TURN servers if needed
          ],
        },
      });

      peer.on("signal", (signalData) => {
        console.log("🔊 peer signal", { signalData, isInitiator });
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

      peer.on("stream", (stream) => {
        console.log("📡 peer stream", stream);
        console.log("Audio tracks:", stream.getAudioTracks());
        console.log("Video tracks:", stream.getVideoTracks());

        remoteStreamRef.current = stream;
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
          userVideo.current.muted = false;
          userVideo.current.onloadedmetadata = () => {
            userVideo.current.play().catch((err) => {
              console.warn("play() error:", err);
            });
          };
        }
      });

      peer.on("ice", (candidate) => {
        console.log("🧊 peer ice candidate", candidate);
        bookedSocket.emit("iceCandidate", {
          to: remotePeerId,
          candidate,
        });
      });

      peer.on("close", () => {
        console.log("❌ peer close");
        cleanupCall();
        navigate("/dashboard");
      });

      peer.on("error", (err) => {
        console.error("⚠ peer error", err);
        toast.error("Peer connection error. Ending call.");
        cleanupCall();
      });

      peerRef.current = peer;

      if (!isInitiator && receivedOffer) {
        console.log("⏳ Receiver signaling offer", receivedOffer);
        peer.signal(receivedOffer);
      }
    };

    // Caller scenario
    if (callStatus === "ready" && remotePeerId) {
      setupPeer(true, null);
      dispatch(setCallStatus("calling"));
    }

    // Receiver scenario
    if (callStatus === "receiving" && offer && !peerRef.current) {
      setupPeer(false, offer);
      dispatch(setCallStatus("connected"));
    }

    // Signal queued ICE candidates
    if (peerRef.current && iceCandidates.length > 0) {
      console.log("🧩 applying queued ICE", iceCandidates);
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

  const cleanupCall = () => {
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
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
    dispatch(clearVideoCall());
  };

  const toggleCamera = () => {
    const vTrack = localStreamRef.current?.getVideoTracks()[0];
    if (vTrack) {
      vTrack.enabled = !vTrack.enabled;
      setIsCameraOn(vTrack.enabled);
    }
  };

  const toggleMicrophone = () => {
    const aTrack = localStreamRef.current?.getAudioTracks()[0];
    if (aTrack) {
      aTrack.enabled = !aTrack.enabled;
      setIsMicOn(aTrack.enabled);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full gap-2 p-2 md:p-4 bg-gray-100 dark:bg-gray-800">
      {/* Video panel */}
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
                {isCameraOn ? (
                  <CameraSolidIcon className="h-5 w-5" />
                ) : (
                  <CameraIcon className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={toggleMicrophone}
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

          {/* Remote Video */}
          <div className="relative w-full h-1/2">
            <video
              ref={userVideo}
              playsInline
              autoPlay
              muted={false}
              controls={false}
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
  );
}
