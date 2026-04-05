import { configureStore } from "@reduxjs/toolkit";
import workspaceReducer from "./workspaceSlice";

export const createAppStore = () =>
  configureStore({
    reducer: {
      workspace: workspaceReducer,
    },
  });

export const store = createAppStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
