import { expect, test } from "vitest";
import { COMPACT, DESKTOP } from "@/game/config";
import { careerY } from "@/game/curves";
import { linePath, milestone, restCandles } from "./geometry";

test("desktop has 7 rest candles, red at 2 and 4", () => {
  const c = restCandles(DESKTOP, false);
  expect(c).toHaveLength(7);
  expect(c.map((x, i) => (x.up ? -1 : i)).filter((i) => i >= 0)).toEqual([2, 4]);
  expect(c[0]).toMatchObject({ width: 24, radius: 8, height: 86 });
  const cx = 0.07 * DESKTOP.width;
  expect(c[0].x).toBeCloseTo(cx - 12, 6);
  expect(c[0].top).toBeCloseTo(careerY(cx, DESKTOP) - 0.62 * 86, 6);
});

test("compact has 5 rest candles, red only at 2", () => {
  const c = restCandles(COMPACT, true);
  expect(c).toHaveLength(5);
  expect(c.map((x, i) => (x.up ? -1 : i)).filter((i) => i >= 0)).toEqual([2]);
  expect(c[0]).toMatchObject({ width: 14, radius: 5 });
});

test("linePath starts at x 0 and ends at the width", () => {
  const d = linePath(() => 10, 100, 10);
  expect(d.startsWith("M0 10")).toBe(true);
  expect(d.endsWith("L100 10")).toBe(true);
});

test("milestones sit on the career line", () => {
  const m = milestone(0.64, DESKTOP);
  expect(m.x).toBeCloseTo(870.4, 6);
  expect(m.y).toBeCloseTo(careerY(870.4, DESKTOP), 6);
});
