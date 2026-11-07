import type { GameConfig } from "./config";

/** The rising career line drawn in the hero, at screen x. */
export function careerY(x: number, c: GameConfig): number {
  const f = x / c.width;
  return c.height * (0.86 - 0.5 * Math.pow(Math.max(f, 0), 1.8) + 0.012 * Math.sin(15 * f));
}

/** The wavy ground the game scrolls over, at world x. */
export function terrainY(wx: number, c: GameConfig): number {
  return c.height * c.baseline + c.wave1 * Math.sin(wx / 190) + c.wave2 * Math.sin(wx / 73 + 1.3);
}
