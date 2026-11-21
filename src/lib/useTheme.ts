"use client";

import { useSyncExternalStore } from "react";
import { currentTheme, serverTheme, subscribeTheme, type Theme } from "./theme";

export function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, currentTheme, serverTheme);
}
