import { describe, expect, test } from "vitest";
import {
  createFlakes,
  createLeaves,
  flakeCount,
  leafCount,
  LEAF_COLORS,
  MAX_FLAKES,
  MAX_LEAVES,
  resizeFlakes,
  stepFlakes,
  stepLeaves,
  type Flake,
} from "./particles";

let seed = 11;
const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

describe("season particles", () => {
  test("counts scale with area and stay capped", () => {
    expect(flakeCount(390, 700)).toBeLessThan(flakeCount(1440, 900));
    expect(flakeCount(5000, 5000)).toBe(MAX_FLAKES);
    expect(leafCount(5000, 5000)).toBe(MAX_LEAVES);
    expect(leafCount(100, 100)).toBeGreaterThan(0);
  });

  test("flakes fall, sway, and come back from the top after leaving the bottom", () => {
    const w = 800, h = 600;
    const flakes = createFlakes(w, h, rng);
    const before = flakes.map((f) => f.y);
    stepFlakes(flakes, 0.1, w, h, rng);
    // (Flakes that started at the very bottom may already have restarted at the top.)
    expect(flakes.every((f, i) => before[i] > h - 20 || f.y > before[i])).toBe(true);
    for (let i = 0; i < 2000; i++) stepFlakes(flakes, 0.05, w, h, rng);
    for (const f of flakes) {
      expect(f.y).toBeLessThanOrEqual(h + f.r + 1);
      expect(f.x).toBeGreaterThanOrEqual(-5);
      expect(f.x).toBeLessThanOrEqual(w + 5);
    }
    expect(flakes).toHaveLength(flakeCount(w, h));
  });

  test("near flakes are crystals of several shapes that turn as they fall", () => {
    const flakes = createFlakes(1440, 900, rng);
    const shapes = new Set(flakes.map((f) => f.shape));
    for (const s of [0, 1, 2, 3]) expect(shapes.has(s as Flake["shape"])).toBe(true);
    const big = flakes.filter((f) => f.shape > 0);
    expect(big.every((f) => f.r >= 3)).toBe(true);
    const rot = big.map((f) => f.rot);
    stepFlakes(big, 0.5, 1440, 900, rng);
    expect(big.some((f, i) => f.rot !== rot[i])).toBe(true);
  });

  test("leaves spin, use autumn colors, and recycle at the bottom", () => {
    const w = 800, h = 600;
    const leaves = createLeaves(w, h, rng);
    expect(leaves.every((l) => LEAF_COLORS.includes(l.color))).toBe(true);
    const rot = leaves.map((l) => l.rot);
    stepLeaves(leaves, 0.2, w, h, rng);
    expect(leaves.some((l, i) => l.rot !== rot[i])).toBe(true);
    for (let i = 0; i < 3000; i++) stepLeaves(leaves, 0.05, w, h, rng);
    for (const l of leaves) expect(l.y).toBeLessThanOrEqual(h + l.size * 2 + 1);
  });

  test("a resize keeps the right count and nothing past the new width", () => {
    const flakes = resizeFlakes(createFlakes(1440, 900, rng), 390, 700, rng);
    expect(flakes).toHaveLength(flakeCount(390, 700));
    expect(flakes.every((f) => f.x <= 390)).toBe(true);
    expect(resizeFlakes(flakes, 1440, 900, rng)).toHaveLength(flakeCount(1440, 900));
  });
});
