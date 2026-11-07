import type { GameConfig } from "@/game/config";
import { careerY } from "@/game/curves";

export type Candle = { x: number; top: number; height: number; width: number; radius: number; up: boolean };

const DESKTOP_CANDLES = { spots: [0.07, 0.15, 0.22, 0.39, 0.47, 0.55, 0.74], heights: [86, 124, 72, 144, 102, 172, 134], red: [2, 4], width: 24, radius: 8 };
const COMPACT_CANDLES = { spots: [0.05, 0.13, 0.38, 0.45, 0.66], heights: [52, 74, 42, 86, 44], red: [2], width: 14, radius: 5 };

export const WICK = 16;

/** The decorative candles that sit on the career line before the game starts. */
export function restCandles(c: GameConfig, compact: boolean): Candle[] {
  const set = compact ? COMPACT_CANDLES : DESKTOP_CANDLES;
  return set.spots.map((f, i) => {
    const cx = c.width * f;
    const height = set.heights[i];
    return {
      x: cx - set.width / 2,
      top: careerY(cx, c) - 0.62 * height,
      height,
      width: set.width,
      radius: set.radius,
      up: !set.red.includes(i),
    };
  });
}

/** SVG path through yAt(x) from 0 to width, sampled every `step` px. */
export function linePath(yAt: (x: number) => number, width: number, step: number): string {
  const pt = (x: number) => `${+x.toFixed(1)} ${+yAt(x).toFixed(1)}`;
  let d = `M${pt(0)}`;
  for (let x = step; x < width; x += step) d += `L${pt(x)}`;
  return `${d}L${pt(width)}`;
}

export function milestone(fraction: number, c: GameConfig): { x: number; y: number } {
  const x = c.width * fraction;
  return { x, y: careerY(x, c) };
}

export const MILESTONES = {
  desktop: [
    { name: "Solve-IT", year: "2022", at: 0.3 },
    { name: "Serva", year: "2026", at: 0.64 },
  ],
  compact: [
    { name: "Solve-IT", year: "2022", at: 0.24 },
    { name: "Serva", year: "2026", at: 0.56 },
  ],
};

/** Sprite anchor: the image is 147×260 at scale 1, its bottom centre is (120, 241) in sprite space. */
export const SPRITE = { x: 46.5, y: -19, width: 147, height: 260, anchorX: 120, anchorY: 241 };
