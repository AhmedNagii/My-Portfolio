import { describe, expect, test } from "vitest";
import { GROUND_Y, HIP_Y, legPath, reach, runnerPose } from "./runner";

/** Lowest foot point, approximated by ankle + shoe height. */
const lowestAnkle = (p: ReturnType<typeof runnerPose>) => Math.max(...p.legs.map((l) => l.ankle[1]));

describe("runner pose", () => {
  test("standing straight keeps the hips where the image puts them", () => {
    const p = runnerPose(0, 0, 0);
    expect(Math.abs(p.drop)).toBeLessThan(8);
    expect(p.legs[0].hip[1]).toBeCloseTo(HIP_Y + p.drop);
  });

  test("on the ground a foot always reaches the ground", () => {
    for (let q = 0; q < Math.PI * 2; q += 0.3) {
      const p = runnerPose(q, 0, 0);
      const lowest = Math.max(...p.legs.map((l) => l.hip[1] + reach(l)));
      expect(lowest).toBeCloseTo(GROUND_Y, 5);
    }
  });

  test("the legs swing: front and back legs trade places over a stride", () => {
    const a = runnerPose(Math.PI / 2, 0, 0);
    const b = runnerPose((3 * Math.PI) / 2, 0, 0);
    expect(a.legs[0].ankle[0]).toBeGreaterThan(a.legs[1].ankle[0]);
    expect(b.legs[0].ankle[0]).toBeLessThan(b.legs[1].ankle[0]);
    expect(legPath(a.legs[0])).not.toBe(legPath(b.legs[0]));
  });

  test("crouching lowers the hips and leans the body forward", () => {
    const run = runnerPose(0, 0, 0);
    const crouch = runnerPose(0, 0, 1);
    expect(crouch.drop).toBeGreaterThan(run.drop + 15);
    expect(crouch.lean).toBeGreaterThan(40);
    expect(crouch.scale).toBeLessThan(1);
  });

  test("in the air the body hangs from the hips with the legs tucked", () => {
    const p = runnerPose(0, 1, 0);
    expect(p.drop).toBe(0);
    expect(lowestAnkle(p)).toBeLessThan(HIP_Y + 44);
  });
});
