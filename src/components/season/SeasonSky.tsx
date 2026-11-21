"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { currentTheme } from "@/lib/theme";
import { useTheme } from "@/lib/useTheme";
import { useAnimationLoop } from "@/lib/useAnimationLoop";
import { createFlakes, createLeaves, resizeFlakes, resizeLeaves, stepFlakes, stepLeaves, type Flake, type Leaf } from "./particles";
import { makeSnowSprites, SPRITE_SCALE } from "./snowSprites";

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribeMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const prefersReduced = () => window.matchMedia(REDUCED).matches;

/** Cross-fade between snow and leaves when the theme changes, per second. */
const FADE_RATE = 2.5;

function drawLeaf(ctx: CanvasRenderingContext2D, l: Leaf, alpha: number) {
  const s = l.size;
  ctx.save();
  ctx.translate(l.x, l.y);
  ctx.rotate(l.rot);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = l.color;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.75, -s * 0.55, s * 0.7, s * 0.45, 0, s);
  ctx.bezierCurveTo(-s * 0.7, s * 0.45, -s * 0.75, -s * 0.55, 0, -s);
  ctx.fill();
  // Midrib and stem.
  ctx.strokeStyle = "rgba(80, 40, 20, 0.45)";
  ctx.lineWidth = Math.max(1, s * 0.09);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.8);
  ctx.lineTo(0, s * 1.25);
  ctx.stroke();
  ctx.restore();
}

/**
 * Snow in dark mode, falling leaves in light mode, drawn on a canvas behind
 * the hero. Decorative only: hidden from assistive tech, ignores the pointer,
 * pauses off screen, and stays still under reduced motion.
 */
export function SeasonSky() {
  const theme = useTheme();
  const reduced = useSyncExternalStore(subscribeMotion, prefersReduced, () => true);
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef({ w: 0, h: 0, dpr: 1, flakes: [] as Flake[], leaves: [] as Leaf[], snow: 1 });
  const sprites = useRef<HTMLCanvasElement[]>([]);

  const draw = useCallback(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const s = world.current;
    ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    ctx.clearRect(0, 0, s.w, s.h);
    if (s.snow > 0) {
      ctx.fillStyle = "#ffffff";
      for (const f of s.flakes) {
        ctx.globalAlpha = f.alpha * s.snow;
        const sprite = f.shape ? sprites.current[f.shape - 1] : undefined;
        if (sprite) {
          // Crystals: stamp the pre-drawn shape, turned to the flake's angle.
          const half = f.r * SPRITE_SCALE;
          const cos = Math.cos(f.rot), sin = Math.sin(f.rot);
          ctx.setTransform(s.dpr * cos, s.dpr * sin, -s.dpr * sin, s.dpr * cos, s.dpr * f.x, s.dpr * f.y);
          ctx.drawImage(sprite, -half, -half, half * 2, half * 2);
          ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
        } else {
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    if (s.snow < 1) for (const l of s.leaves) drawLeaf(ctx, l, 1 - s.snow);
    ctx.globalAlpha = 1;
  }, []);

  // Size the canvas to its box, at up to 2× for sharp edges.
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    // The first render used the server's dark default; start from the real theme.
    world.current.snow = currentTheme() === "dark" ? 1 : 0;
    sprites.current = makeSnowSprites();
    const fit = () => {
      const s = world.current;
      const { width, height } = el.getBoundingClientRect();
      s.dpr = Math.min(2, window.devicePixelRatio || 1);
      s.w = width;
      s.h = height;
      el.width = Math.round(width * s.dpr);
      el.height = Math.round(height * s.dpr);
      s.flakes = s.flakes.length ? resizeFlakes(s.flakes, width, height, Math.random) : createFlakes(width, height, Math.random);
      s.leaves = s.leaves.length ? resizeLeaves(s.leaves, width, height, Math.random) : createLeaves(width, height, Math.random);
      draw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw]);

  // Under reduced motion there's no loop: jump straight to the new season.
  useEffect(() => {
    if (!reduced) return;
    world.current.snow = theme === "dark" ? 1 : 0;
    draw();
  }, [reduced, theme, draw]);

  const onFrame = useCallback(
    (dt: number) => {
      const s = world.current;
      const target = theme === "dark" ? 1 : 0;
      s.snow = s.snow < target ? Math.min(target, s.snow + FADE_RATE * dt) : Math.max(target, s.snow - FADE_RATE * dt);
      if (s.snow > 0) stepFlakes(s.flakes, dt, s.w, s.h, Math.random, 8);
      if (s.snow < 1) stepLeaves(s.leaves, dt, s.w, s.h, Math.random, 10);
      draw();
      return true;
    },
    [theme, draw],
  );
  useAnimationLoop(onFrame, !reduced, canvas);

  return <canvas ref={canvas} aria-hidden="true" data-season={theme === "dark" ? "snow" : "leaves"} className="pointer-events-none absolute inset-0 size-full" />;
}
