"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { applyTheme, storedTheme, systemTheme } from "@/lib/theme";
import { switchTheme } from "@/lib/themeSwitch";
import { useTheme } from "@/lib/useTheme";
import { MoonIcon, SunIcon } from "./icons";

const noop = () => () => {};

/**
 * Sun / moon button in the header. Until hydration (and without JavaScript,
 * where it couldn't work) an empty spacer of the same size holds its place.
 */
export function ThemeToggle() {
  const theme = useTheme();
  const hydrated = useSyncExternalStore(noop, () => true, () => false);

  // In development Strict Mode remounts <html> and drops the attribute the
  // head script set; put it back before paint. A no-op in production.
  useLayoutEffect(() => {
    applyTheme(storedTheme() ?? systemTheme());
  }, []);

  if (!hydrated) return <span aria-hidden="true" className="inline-block size-11" />;
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => switchTheme(next)}
      aria-label={`Switch to ${next} mode`}
      className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full bg-raised text-text transition-colors hover:bg-control"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
