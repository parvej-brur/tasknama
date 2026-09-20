import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { dataImported } from "@/features/backup/actions";

import type { Tag } from "./types";

export type TagsState = { byId: Record<string, Tag> };

export const initialTagsState: TagsState = { byId: {} };

const tagsSlice = createSlice({
  name: "tags",
  initialState: initialTagsState,
  reducers: {
    tagAdded(state, action: PayloadAction<Tag>) {
      if (!state.byId[action.payload.id]) state.byId[action.payload.id] = action.payload;
    },
    tagRenamed(state, action: PayloadAction<{ id: string; name: string; at: string }>) {
      const tag = state.byId[action.payload.id];
      if (!tag) return;
      tag.name = action.payload.name;
      tag.updatedAt = action.payload.at;
    },
    // The tasks slice removes the tag from every task that carries it.
    tagDeleted: {
      reducer(state, action: PayloadAction<{ id: string; at: string }>) {
        delete state.byId[action.payload.id];
      },
      prepare(id: string, at: string = new Date().toISOString()) {
        return { payload: { id, at } };
      },
    },
  },
  extraReducers: (builder) => {
    builder.addCase(dataImported, (state, action) => {
      state.byId = Object.fromEntries(action.payload.tags.map((t) => [t.id, t]));
    });
  },
});

export const { tagAdded, tagRenamed, tagDeleted } = tagsSlice.actions;
export default tagsSlice.reducer;
