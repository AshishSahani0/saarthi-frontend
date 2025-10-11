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
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";

// ✅ Tailwind Button Component
const Button = ({ children, onClick, variant = "primary" }) => {
  const colors = {
    primary: "bg-blue-600 hover:bg-blue-700",
    danger: "bg-red-600 hover:bg-red-700",
    success: "bg-green-600 hover:bg-green-700",
    gray: "bg-gray-600 hover:bg-gray-700",
  };
  return (
    <button
      onClick={onClick}
      className={`${colors[variant]} text-white px-4 py-2 rounded-lg flex items-center gap-2`}
    >
      {children}
    </button>
  );
};

const VideoCall = ({ bookingId, targetUserId }) => {
  const dispatch = useDispatch();
  const { offer, answer, remotePeerId, callStatus, iceCandidates } = useSelector(
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
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    const remoteStream = new MediaStream();
    remoteVideoRef.current.srcObject = remoteStream;

    // Track remote media
    peerConnection.current.ontrack = (event) => {
      console.log("🎥 Remote track received");
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    // Send ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && remotePeerId) {
        console.log("📨 Sending ICE candidate");
        bookedSocket.emit("iceCandidate", {
          to: remotePeerId,
          candidate: event.candidate,
        });
      }
    };

    // Get local stream
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

  // ========== 2️⃣ Start Call ==========
  const startCall = async () => {
    await setupPeerConnection();
    dispatch(setCallStatus("calling"));
    console.log("📞 Starting call...");

    const offerDesc = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offerDesc);

    bookedSocket.emit("callUser", {
      userToCall: targetUserId,
      signalData: offerDesc,
      from: user._id,
      bookingId,
    });

    dispatch(setOffer(offerDesc));
  };

  // ========== 3️⃣ Accept Call ==========
  const acceptCall = async () => {
    await setupPeerConnection();
    console.log("✅ Accepting incoming call...");

    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));

    const answerDesc = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answerDesc);

    bookedSocket.emit("acceptCall", {
      to: remotePeerId,
      signal: answerDesc,
    });

    dispatch(setCallStatus("connected"));
  };

  // ========== 4️⃣ Handle Offer / Answer / ICE ==========
  useEffect(() => {
    bookedSocket.on("callOffer", async (offer, fromPeerId, bookingId) => {
      console.log("📩 Received Offer from", fromPeerId);
      dispatch(setOffer(offer));
      dispatch(setRemotePeerId(fromPeerId));
      dispatch(setCallStatus("receiving"));
    });

    bookedSocket.on("callAnswer", async (answer) => {
      console.log("📩 Received Answer");
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        dispatch(setCallStatus("connected"));
      }
    });

    bookedSocket.on("iceCandidate", async (candidate) => {
      console.log("📩 Received ICE candidate");
      try {
        if (peerConnection.current?.remoteDescription) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          // queue if remote description not yet set
          dispatch(addIceCandidate(candidate));
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    bookedSocket.on("callEnded", endCall);

    return () => {
      bookedSocket.off("callOffer");
      bookedSocket.off("callAnswer");
      bookedSocket.off("iceCandidate");
      bookedSocket.off("callEnded");
    };
  }, [remotePeerId]);

  // apply queued ICE after remote desc is set
  useEffect(() => {
    if (peerConnection.current && peerConnection.current.remoteDescription && iceCandidates.length > 0) {
      iceCandidates.forEach(async (candidate) => {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Failed adding queued ICE", e);
        }
      });
    }
  }, [iceCandidates]);

  // ========== 5️⃣ End Call ==========
  const endCall = () => {
    console.log("🛑 Ending call...");
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

  // ========== 6️⃣ Mute Toggle ==========
  const toggleMute = () => {
    const audioTrack = localStream.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gray-900 text-white rounded-2xl shadow-lg w-full max-w-xl mx-auto">
      <h2 className="text-lg font-semibold mb-2">
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
          <Button variant="success" onClick={startCall}>
            <Phone size={18} /> Call
          </Button>
        )}
        {callStatus === "receiving" && (
          <Button variant="primary" onClick={acceptCall}>
            <Phone size={18} /> Accept
          </Button>
        )}
        {callStatus === "connected" && (
          <>
            <Button variant="gray" onClick={toggleMute}>
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              {isMuted ? "Unmute" : "Mute"}
            </Button>
            <Button variant="danger" onClick={endCall}>
              <PhoneOff size={18} /> End
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
