// src/redux/slices/videoSlice.js

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  callStatus: "idle", // "idle" | "ready" | "calling" | "receiving" | "connected"
  offer: null,
  answer: null,
  iceCandidates: [], // queued ICE before peer exists
  callError: null,
  peerId: null,
  remotePeerId: null,
};

const videoSlice = createSlice({
  name: "video",
  initialState,
  reducers: {
    setCallStatus(state, action) {
      state.callStatus = action.payload;
      if (action.payload === "idle" || action.payload === "ended") {
        // reset entire state
        Object.assign(state, { ...initialState });
      }
    },
    setOffer(state, action) {
      state.offer = action.payload;
    },
    setAnswer(state, action) {
      state.answer = action.payload;
    },
    addIceCandidate(state, action) {
      const candidate = action.payload;
      if (!candidate) return;
      // Avoid duplicate candidates
      if (
        !state.iceCandidates.some(
          (c) => JSON.stringify(c) === JSON.stringify(candidate)
        )
      ) {
        state.iceCandidates.push(candidate);
      }
    },
    setCallError(state, action) {
      state.callError = action.payload;
    },
    setPeerId(state, action) {
      state.peerId = action.payload;
    },
    setRemotePeerId(state, action) {
      state.remotePeerId = action.payload;
    },
    clearVideoCall(state) {
      Object.assign(state, { ...initialState });
    },
  },
});

export const {
  setCallStatus,
  setOffer,
  setAnswer,
  addIceCandidate,
  setCallError,
  setPeerId,
  setRemotePeerId,
  clearVideoCall,
} = videoSlice.actions;

export default videoSlice.reducer;
