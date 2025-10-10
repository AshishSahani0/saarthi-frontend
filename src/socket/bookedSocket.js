import { io } from "socket.io-client";
import store from "../redux/store";
import {
  addMessage,
  mergeMessages,
  setActiveRoomId,
} from "../redux/slices/chatSlice";
import {
  setOffer,
  setAnswer,
  addIceCandidate,
  setCallStatus,
  setRemotePeerId,
  clearVideoCall,
} from "../redux/slices/videoSlice";
import { toast } from "react-toastify";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const bookedSocket = io(`${SOCKET_URL}/booked`, {
  autoConnect: false,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

// Safe delayed connect
setTimeout(() => {
  if (!bookedSocket.connected) bookedSocket.connect();
}, 500);

const identifyUser = () => {
  const state = store.getState();
  const user = state.auth?.user;
  if (user?._id) {
    bookedSocket.emit("identify", { userId: user._id, role: user.role });
    console.log(`[socket] identify emitted for user: ${user._id}`);
  } else {
    console.warn("[socket] User not logged in. Cannot identify.");
  }
};

const rejoinRoom = () => {
  const state = store.getState();
  const user = state.auth?.user;
  const activeRoomId = state.chat?.activeRoomId;
  const activeBookingId = state.chat?.activeBookingId;
  if (user && activeRoomId) {
    bookedSocket.emit("joinRoom", {
      roomId: activeRoomId,
      user,
      bookingId: activeBookingId,
    });
  }
};

// ===== Chat Events =====
bookedSocket.on("receiveMessage", (message) => {
  store.dispatch(addMessage(message));
});

bookedSocket.on("receiveMessagesBatch", (messages) => {
  store.dispatch(mergeMessages(messages));
});

// ===== Video Call Signaling =====
bookedSocket.on("callOffer", (offer, fromPeerId, bookingId) => {
  console.log("[socket] callOffer received", { fromPeerId });
  store.dispatch(setOffer(offer));
  store.dispatch(setRemotePeerId(fromPeerId));
  store.dispatch(setCallStatus("receiving"));
});

bookedSocket.on("callAnswer", (answer) => {
  console.log("[socket] callAnswer received");
  store.dispatch(setAnswer(answer));
  store.dispatch(setCallStatus("connected"));
});

bookedSocket.on("iceCandidate", (candidate) => {
  console.log("[socket] iceCandidate received");
  store.dispatch(addIceCandidate(candidate));
});

bookedSocket.on("callEnded", () => {
  console.log("[socket] callEnded received");
  store.dispatch(clearVideoCall());
});

// ===== Connection & Reconnect =====
bookedSocket.on("connect", () => {
  console.log(`[socket] connected: ${bookedSocket.id}`);
  toast.dismiss("socket-reconnect");
  identifyUser();
  rejoinRoom();
});

bookedSocket.on("disconnect", (reason) => {
  console.warn("[socket] disconnected:", reason);
});

bookedSocket.on("reconnect_attempt", (attempt) => {
  toast.loading(`Reconnecting... (${attempt})`, { toastId: "socket-reconnect" });
});

bookedSocket.on("reconnect", () => {
  console.log("[socket] reconnected");
  toast.dismiss("socket-reconnect");
  toast.success("Reconnected to server");
  identifyUser();
  rejoinRoom();
});

export default bookedSocket;
