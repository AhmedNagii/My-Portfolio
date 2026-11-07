import { expect, test } from "vitest";
import { DESKTOP } from "@/game/config";
import { careerY, terrainY } from "@/game/curves";

test("career line starts low and rises to the right", () => {
  expect(careerY(0, DESKTOP)).toBeCloseTo(0.86 * 520, 6);
  expect(careerY(DESKTOP.width, DESKTOP)).toBeLessThan(careerY(0, DESKTOP));
});

test("terrain waves around the baseline", () => {
  expect(terrainY(0, DESKTOP)).toBeCloseTo(0.74 * 520 + 9 * Math.sin(1.3), 6);
});
