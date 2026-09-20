import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { dataImported } from "@/features/backup/actions";

import type { FocusSession } from "./types";

export type FocusState = { sessionsById: Record<string, FocusSession> };

export const initialFocusState: FocusState = { sessionsById: {} };

const focusSlice = createSlice({
  name: "focus",
  initialState: initialFocusState,
  reducers: {
    // Inserts or replaces a session. All timer logic lives in ./session.
    focusSessionSaved(state, action: PayloadAction<FocusSession>) {
      state.sessionsById[action.payload.id] = action.payload;
    },
    // The user answered the end-of-session prompt.
    focusSessionAcknowledged(state, action: PayloadAction<string>) {
      const session = state.sessionsById[action.payload];
      if (session) session.acknowledged = true;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(dataImported, (state, action) => {
      state.sessionsById = Object.fromEntries(
        action.payload.focusSessions.map((s) => [s.id, s]),
      );
    });
  },
});

export const { focusSessionSaved, focusSessionAcknowledged } = focusSlice.actions;
export default focusSlice.reducer;
