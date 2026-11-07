import { describe, expect, test } from "vitest";
import { DESKTOP, MAX_DT } from "@/game/config";
import { createGame, jump, playerScreenX, score, start, step, type GameState } from "@/game/engine";

const rng = () => 0.5;
const playing = () => start(createGame(), DESKTOP);
const run = (s: GameState, seconds: number, dt = 0.05) => {
  for (let t = 0; t < seconds - 1e-9; t += dt) s = step(s, DESKTOP, dt, rng);
  return s;
};

describe("game engine", () => {
  test("a new game is idle and start begins play at start speed", () => {
    expect(createGame().mode).toBe("idle");
    const s = playing();
    expect(s.mode).toBe("playing");
    expect(s.speed).toBe(DESKTOP.startSpeed);
    expect(s.obstacles).toEqual([]);
  });

  test("jumping from the ground leaves the ground and lands again", () => {
    let s = jump(playing(), DESKTOP);
    expect(s.velocity).toBe(DESKTOP.jumpVelocity);
    expect(s.grounded).toBe(false);
    const airtime = (2 * DESKTOP.jumpVelocity) / DESKTOP.gravity;
    s = run(s, airtime + 0.05);
    expect(s.grounded).toBe(true);
    expect(s.jumpHeight).toBe(0);
  });

  test("a jump while airborne is buffered, not a double jump", () => {
    let s = jump(playing(), DESKTOP);
    s = step(s, DESKTOP, 0.05, rng);
    const v = s.velocity;
    s = jump(s, DESKTOP);
    expect(s.jumpBuffer).toBe(0.12);
    expect(s.velocity).toBe(v);
  });

  test("a buffered jump fires on landing", () => {
    let s = jump(playing(), DESKTOP);
    s = run(s, 0.75);
    expect(s.grounded).toBe(false);
    s = jump(s, DESKTOP);
    s = run(s, 0.1);
    expect(s.grounded).toBe(false);
    expect(s.velocity).toBeGreaterThan(0);
  });

  test("a huge frame gap moves no further than one clamped frame", () => {
    const base = playing();
    expect(step(base, DESKTOP, 5, rng).distance).toBeCloseTo(step(base, DESKTOP, MAX_DT, rng).distance, 6);
  });

  test("speed never passes the maximum", () => {
    expect(run(playing(), 120).speed).toBeLessThanOrEqual(DESKTOP.maxSpeed);
  });

  test("nothing spawns during the intro transition", () => {
    const s = step(playing(), DESKTOP, 0.05, rng);
    expect(s.transition).toBeLessThan(1);
    expect(s.obstacles).toHaveLength(0);
  });

  test("obstacles are always far enough apart to clear", () => {
    let s = playing();
    const seen = new Set<number>();
    const xs: number[] = [];
    for (let i = 0; i < 2000; i++) {
      s = step({ ...s, jumpHeight: 1000, grounded: false, velocity: 0 }, DESKTOP, 0.02, rng);
      s = { ...s, jumpHeight: 0, grounded: true };
      for (const o of s.obstacles) if (!seen.has(o.worldX)) { seen.add(o.worldX); xs.push(o.worldX); }
    }
    expect(xs.length).toBeGreaterThan(3);
    const minGap = DESKTOP.startSpeed * ((2 * DESKTOP.jumpVelocity) / DESKTOP.gravity + 0.12);
    for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(minGap);
  });

  test("hitting a candle ends the game; clearing it does not", () => {
    const base: GameState = { ...playing(), transition: 1, nextSpawnIn: 1e9 };
    const x = base.scroll + playerScreenX(base, DESKTOP);
    const withCandle = { ...base, obstacles: [{ kind: "candle" as const, worldX: x, height: 100 }] };
    const hit = step(withCandle, DESKTOP, 0.001, rng);
    expect(hit.mode).toBe("over");
    expect(hit.hitBy).toBe("candle");
    const cleared = step({ ...withCandle, jumpHeight: 95, grounded: false, velocity: 0 }, DESKTOP, 0.001, rng);
    expect(cleared.mode).toBe("playing");
  });

  test("score is distance over 40 and restarting resets the run", () => {
    expect(score({ ...createGame(), distance: 1000 })).toBe(25);
    const over: GameState = { ...playing(), mode: "over", distance: 900, hitBy: "bug", obstacles: [{ kind: "bug", worldX: 5, height: 32 }] };
    const again = start(over, DESKTOP);
    expect(again.mode).toBe("playing");
    expect(again.distance).toBe(0);
    expect(again.obstacles).toEqual([]);
    expect(again.hitBy).toBeNull();
  });

  test("an idle or finished game does not move", () => {
    const idle = createGame();
    expect(step(idle, DESKTOP, 0.05, rng)).toBe(idle);
  });
});
