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
import { Button } from "../../components/ui/button";
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

  // 🔹 Setup PeerConnection
  const setupPeerConnection = async () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    const remoteStream = new MediaStream();
    remoteVideoRef.current.srcObject = remoteStream;

    peerConnection.current.ontrack = (event) => {
      console.log("🎥 Remote track received");
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && remotePeerId) {
        bookedSocket.emit("iceCandidate", {
          to: remotePeerId,
          candidate: event.candidate,
        });
      }
    };

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
      console.error("Camera/mic access error:", err);
    }
  };

  // 🔹 Start Call
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

  // 🔹 Accept Call
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

  // 🔹 Handle ICE candidates (both sides)
  useEffect(() => {
    if (!peerConnection.current) return;

    bookedSocket.on("iceCandidate", async (candidate) => {
      try {
        console.log("❄️ ICE candidate received");
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE:", err);
      }
    });
  }, [remotePeerId]);

  // 🔹 Socket listeners (Offer, Answer, End)
  useEffect(() => {
    bookedSocket.on("callOffer", async (offer, fromPeerId, bookingId) => {
      console.log("📩 Offer received from", fromPeerId);
      dispatch(setOffer(offer));
      dispatch(setRemotePeerId(fromPeerId));
      dispatch(setCallStatus("receiving"));
    });

    bookedSocket.on("callAnswer", async (answer) => {
      console.log("📩 Answer received");
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        dispatch(setCallStatus("connected"));
      }
    });

    bookedSocket.on("callEnded", endCall);

    return () => {
      bookedSocket.off("callOffer");
      bookedSocket.off("callAnswer");
      bookedSocket.off("iceCandidate");
      bookedSocket.off("callEnded");
    };
  }, []);

  // 🔹 End Call
  const endCall = () => {
    console.log("🛑 Ending call");
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

  // 🔹 Mute / Unmute
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
          <Button onClick={startCall} className="bg-green-600 hover:bg-green-700">
            <Phone className="mr-2" size={18} /> Call
          </Button>
        )}
        {callStatus === "receiving" && (
          <Button onClick={acceptCall} className="bg-blue-600 hover:bg-blue-700">
            <Phone className="mr-2" size={18} /> Accept
          </Button>
        )}
        {callStatus === "connected" && (
          <>
            <Button onClick={toggleMute} className="bg-gray-600 hover:bg-gray-700">
              {isMuted ? "Unmute" : "Mute"}
            </Button>
            <Button onClick={endCall} className="bg-red-600 hover:bg-red-700">
              <PhoneOff className="mr-2" size={18} /> End
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
