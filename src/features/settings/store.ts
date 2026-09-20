import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { dataImported } from "@/features/backup/actions";

import { coerceSettings } from "./schemas";
import { DEFAULT_SETTINGS, type Settings } from "./types";

const settingsSlice = createSlice({
  name: "settings",
  initialState: DEFAULT_SETTINGS as Settings,
  reducers: {
    settingsChanged(state, action: PayloadAction<Partial<Settings>>) {
      // Coercion clamps out-of-range values instead of storing them.
      return coerceSettings({ ...state, ...action.payload });
    },
  },
  extraReducers: (builder) => {
    builder.addCase(dataImported, (_state, action) => action.payload.settings);
  },
});

export const { settingsChanged } = settingsSlice.actions;
export default settingsSlice.reducer;
