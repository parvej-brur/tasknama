import type { RootState } from "@/lib/store/create-store";

export const selectSettings = (state: RootState) => state.settings;
