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

  const { callStatus, offer, remotePeerId, iceCandidates } = useSelector((state) => state.video);

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isLocalReady, setIsLocalReady] = useState(false);

  useEffect(() => {
    if (!user?._id || !booking) return;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
          myVideo.current.muted = true;
          myVideo.current.play().catch(console.warn);
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
      if (bookingId !== booking._id) return;
      dispatch(setRemotePeerId(fromPeerId));
      dispatch(setOffer(signal));
      dispatch(setCallStatus("receiving"));
      toast.info("Incoming video call...");
    };

    const onCallAnswer = (signal) => {
      if (peerRef.current) {
        peerRef.current.signal(signal);
      } else {
        dispatch(setAnswer(signal));
      }
    };

    const onIce = (candidate) => {
      if (peerRef.current) {
        peerRef.current.signal(candidate);
      } else {
        dispatch(addIceCandidate(candidate));
      }
    };

    const onCallEnd = () => {
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
  }, [user, booking]);

  useEffect(() => {
    if (!isLocalReady || peerRef.current) return;

    const setupPeer = (isInitiator, receivedSignal = null) => {
      const peer = new Peer({
        initiator: isInitiator,
        stream: localStreamRef.current,
        trickle: true,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" },
          ],
        },
      });

      peer.on("signal", (data) => {
        console.log("SIGNAL:", data);

        if (data.type === "offer") {
          dispatch(setOffer(data));
          bookedSocket.emit("callUser", {
            userToCall: remotePeerId,
            signalData: data,
            from: user._id,
            bookingId: booking._id,
          });
        } else if (data.type === "answer") {
          dispatch(setAnswer(data));
          bookedSocket.emit("acceptCall", {
            to: remotePeerId,
            signal: data,
          });
        } else {
          // ICE candidate
          bookedSocket.emit("iceCandidate", {
            to: remotePeerId,
            candidate: data,
          });
        }
      });

      peer.on("stream", (remoteStream) => {
        console.log("REMOTE STREAM RECEIVED", remoteStream);
        if (userVideo.current) {
          userVideo.current.srcObject = remoteStream;
          userVideo.current.onloadedmetadata = () => {
            userVideo.current.play().catch((err) => {
              console.warn("play() error:", err);
            });
          };
        }
      });

      peer.on("error", (err) => {
        console.error("Peer error:", err);
        toast.error("Peer connection error.");
        cleanupCall();
      });

      peer.on("close", () => {
        cleanupCall();
        navigate("/dashboard");
      });

      peerRef.current = peer;

      if (!isInitiator && receivedSignal) {
        peer.signal(receivedSignal);
      }

      iceCandidates.forEach((cand) => peer.signal(cand));
    };

    if (callStatus === "ready" && remotePeerId) {
      setupPeer(true);
      dispatch(setCallStatus("calling"));
    } else if (callStatus === "receiving" && offer) {
      setupPeer(false, offer);
      dispatch(setCallStatus("connected"));
    }
  }, [isLocalReady, callStatus, remotePeerId, offer, iceCandidates]);

  const cleanupCall = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    dispatch(clearVideoCall());
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsCameraOn(track.enabled);
    }
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMicOn(track.enabled);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full gap-2 p-2 md:p-4 bg-gray-100 dark:bg-gray-800">
      <div className="flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-xl p-2 md:p-4 flex-[2] min-h-[300px] md:min-h-[500px]">
        <div className="flex flex-col w-full h-full gap-2">
          <div className="relative w-full h-1/2">
            <video
              ref={myVideo}
              autoPlay
              playsInline
              muted
              className="w-full h-full rounded-lg bg-black object-cover transform scale-x-[-1]"
            />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 px-2 py-1 rounded-full shadow-lg">
              <button onClick={toggleCamera} className="p-2 rounded-full bg-white text-gray-800 dark:bg-gray-700 dark:text-white hover:bg-gray-200 transition">
                {isCameraOn ? <CameraSolidIcon className="h-5 w-5" /> : <CameraIcon className="h-5 w-5" />}
              </button>
              <button onClick={toggleMic} className="p-2 rounded-full bg-white text-gray-800 dark:bg-gray-700 dark:text-white hover:bg-gray-200 transition">
                {isMicOn ? <MicrophoneSolidIcon className="h-5 w-5" /> : <MicrophoneIcon className="h-5 w-5" />}
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
 