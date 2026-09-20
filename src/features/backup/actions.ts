import { createAction } from "@reduxjs/toolkit";

import type { AppData } from "./backup";

// Replaces every slice with imported data. Each slice handles its own part.
export const dataImported = createAction<AppData>("data/imported");

export const replaceAllData = (data: AppData) => dataImported(data);
