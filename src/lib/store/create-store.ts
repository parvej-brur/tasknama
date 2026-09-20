import { combineReducers, configureStore } from "@reduxjs/toolkit";

import focusReducer from "@/features/focus/store";
import projectsReducer from "@/features/projects/store";
import settingsReducer from "@/features/settings/store";
import tagsReducer from "@/features/tags/store";
import tasksReducer from "@/features/tasks/store";

const rootReducer = combineReducers({
  tasks: tasksReducer,
  projects: projectsReducer,
  tags: tagsReducer,
  focus: focusReducer,
  settings: settingsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export function createAppStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    // Domain records are plain JSON, and a 5,000-task dev seed would make
    // the dev-only immutability/serializability checks dominate every action.
    middleware: (getDefault) =>
      getDefault({ immutableCheck: false, serializableCheck: false }),
  });
}

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore["dispatch"];
export type AppThunk<R = void> = (
  dispatch: AppDispatch,
  getState: () => RootState,
) => R;
