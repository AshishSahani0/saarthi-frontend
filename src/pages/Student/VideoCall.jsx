// src/components/video/VideoCall.jsx
import React, { useEffect, useRef, useState } from "react";
import bookedSocket from "../../socket/bookedSocket";
import { useSelector, useDispatch } from "react-redux";
import {
  setOffer,
  setAnswer,
  addIceCandidate,
  setCallStatus,
  setRemotePeerId,
  clearVideoCall,
} from "../../redux/slices/videoSlice";
import { Phone, PhoneOff } from "lucide-react";

const VideoCall = ({ bookingId, targetUserId }) => {
  const dispatch = useDispatch();
  const { offer, answer, remotePeerId, callStatus } = useSelector(
    (state) => state.video
  );
  const { user } = useSelector((state) => state.auth);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);

  const [isMuted, setIsMuted] = useState(false);

  // ========== 1️⃣ Setup Peer Connection ==========
  const setupPeerConnection = async () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    // Remote stream
    const remoteStream = new MediaStream();
    remoteVideoRef.current.srcObject = remoteStream;

    peerConnection.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    // ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && remotePeerId) {
        bookedSocket.emit("iceCandidate", {
          to: remotePeerId,
          candidate: event.candidate,
        });
      }
    };

    // Local media
    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoRef.current.srcObject = localStream.current;
      localStream.current.getTracks().forEach((track) =>
        peerConnection.current.addTrack(track, localStream.current)
      );
    } catch (err) {
      console.error("Error accessing camera/mic:", err);
    }
  };

  // ========== 2️⃣ Start a Call ==========
  const startCall = async () => {
    await setupPeerConnection();
    dispatch(setCallStatus("calling"));

    const offerDesc = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offerDesc);

    bookedSocket.emit("callUser", {
      userToCall: targetUserId,
      signalData: offerDesc,
      from: user._id,
      bookingId,
    });
  };

  // ========== 3️⃣ Accept Incoming Call ==========
  const acceptCall = async () => {
    await setupPeerConnection();
    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));

    const answerDesc = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answerDesc);

    bookedSocket.emit("acceptCall", {
      to: remotePeerId,
      signal: answerDesc,
    });

    dispatch(setCallStatus("connected"));
  };

  // ========== 4️⃣ Handle ICE Candidates ==========
  useEffect(() => {
    if (!peerConnection.current) return;

    const handleIce = async (candidate) => {
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    };

    bookedSocket.on("iceCandidate", handleIce);
    return () => bookedSocket.off("iceCandidate", handleIce);
  }, [remotePeerId]);

  // ========== 5️⃣ Socket Listeners ==========
  useEffect(() => {
    const handleOffer = (incomingOffer, fromPeerId, bookingIdReceived) => {
      if (bookingIdReceived !== bookingId) return;
      dispatch(setOffer(incomingOffer));
      dispatch(setRemotePeerId(fromPeerId));
      dispatch(setCallStatus("receiving"));
    };

    const handleAnswer = async (incomingAnswer) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(incomingAnswer));
      dispatch(setCallStatus("connected"));
    };

    bookedSocket.on("callOffer", handleOffer);
    bookedSocket.on("callAnswer", handleAnswer);
    bookedSocket.on("callEnded", endCall);

    return () => {
      bookedSocket.off("callOffer", handleOffer);
      bookedSocket.off("callAnswer", handleAnswer);
      bookedSocket.off("callEnded", endCall);
    };
  }, [dispatch, bookingId]);

  // ========== 6️⃣ End Call ==========
  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
    }
    dispatch(clearVideoCall());
    bookedSocket.emit("callEnded", { to: remotePeerId });
  };

  // ========== 7️⃣ Mute / Unmute ==========
  const toggleMute = () => {
    const audioTrack = localStream.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gray-900 text-white rounded-2xl shadow-lg w-full max-w-lg mx-auto">
      <h2 className="text-lg font-semibold">
        {callStatus === "calling"
          ? "Calling..."
          : callStatus === "receiving"
          ? "Incoming Call..."
          : callStatus === "connected"
          ? "In Call"
          : "Video Call"}
      </h2>

      <div className="grid grid-cols-2 gap-2 w-full h-64">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="rounded-xl border border-gray-600 w-full h-full object-cover"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="rounded-xl border border-gray-600 w-full h-full object-cover"
        />
      </div>

      <div className="flex gap-4 mt-4">
        {callStatus === "idle" && (
          <button
            onClick={startCall}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
          >
            <Phone size={18} /> Call
          </button>
        )}
        {callStatus === "receiving" && (
          <button
            onClick={acceptCall}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            <Phone size={18} /> Accept
          </button>
        )}
        {callStatus === "connected" && (
          <>
            <button
              onClick={toggleMute}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button
              onClick={endCall}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
            >
              <PhoneOff size={18} /> End
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
