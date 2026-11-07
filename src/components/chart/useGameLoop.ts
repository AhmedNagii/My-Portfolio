"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Runs onFrame(dt) on every animation frame while `active`, until it returns
 * false. Pauses while the tab is hidden or `target` is off screen, and the
 * first frame after a pause gets dt 0 so nothing jumps.
 */
export function useGameLoop(onFrame: (dt: number) => boolean, active: boolean, target: RefObject<Element | null>) {
  const frame = useRef(onFrame);
  useEffect(() => {
    frame.current = onFrame;
  });

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = 0;
    let done = false;
    let visible = document.visibilityState !== "hidden";
    let onScreen = true;

    const tick = (now: number) => {
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      raf = 0;
      if (!frame.current(dt)) {
        done = true;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const run = () => {
      if (done || raf || !visible || !onScreen) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const pause = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onVisibility = () => {
      visible = document.visibilityState !== "hidden";
      if (visible) run();
      else pause();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const el = target.current;
    const io =
      el && "IntersectionObserver" in window
        ? new IntersectionObserver(([entry]) => {
            onScreen = entry.isIntersecting;
            if (onScreen) run();
            else pause();
          })
        : null;
    if (el) io?.observe(el);

    run();
    return () => {
      pause();
      document.removeEventListener("visibilitychange", onVisibility);
      io?.disconnect();
    };
  }, [active, target]);
}
