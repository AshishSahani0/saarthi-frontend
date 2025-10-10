import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  callStatus: "idle", // idle | calling | receiving | connected
  offer: null,
  answer: null,
  remotePeerId: null,
  iceCandidates: [],
};

const videoSlice = createSlice({
  name: "video",
  initialState,
  reducers: {
    setCallStatus: (state, action) => {
      state.callStatus = action.payload;
    },
    setOffer: (state, action) => {
      state.offer = action.payload;
    },
    setAnswer: (state, action) => {
      state.answer = action.payload;
    },
    setRemotePeerId: (state, action) => {
      state.remotePeerId = action.payload;
    },
    addIceCandidate: (state, action) => {
      state.iceCandidates.push(action.payload);
    },
    clearVideoCall: (state) => {
      state.callStatus = "idle";
      state.offer = null;
      state.answer = null;
      state.remotePeerId = null;
      state.iceCandidates = [];
    },
  },
});

export const {
  setCallStatus,
  setOffer,
  setAnswer,
  setRemotePeerId,
  addIceCandidate,
  clearVideoCall,
} = videoSlice.actions;

export default videoSlice.reducer;
