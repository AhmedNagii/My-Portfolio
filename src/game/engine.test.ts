import { describe, expect, test } from "vitest";
import { DESKTOP, DIFFICULTY, MAX_DT } from "@/game/config";
import { createGame, duck, jump, level, minGap, playerScreenX, score, start, step, type GameState, type Obstacle } from "@/game/engine";

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

  /** Runs a long game where nothing can hit the player, collecting every obstacle once. */
  const spawnAll = (random: () => number, frames = 20000) => {
    let s = playing();
    const seen: Obstacle[] = [];
    for (let i = 0; i < frames; i++) {
      // Hover between ground obstacles and flyers, so nothing ever overlaps.
      s = step({ ...s, jumpHeight: 1000, grounded: false, velocity: 0, ducking: false }, DESKTOP, 0.02, random);
      s = { ...s, jumpHeight: 0, grounded: true };
      for (const o of s.obstacles) if (!seen.some((p) => p.worldX === o.worldX)) seen.push(o);
    }
    return { seen, s };
  };

  test("obstacles are always far enough apart to clear", () => {
    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const { seen } = spawnAll(random);
    expect(seen.length).toBeGreaterThan(30);
    expect(new Set(seen.map((o) => o.kind))).toEqual(new Set(["candle", "bug", "flyer"]));
    for (let i = 1; i < seen.length; i++) {
      const need = DESKTOP.startSpeed * minGap(seen[i - 1].kind, seen[i].kind, DESKTOP);
      expect(seen[i].worldX - seen[i - 1].worldX).toBeGreaterThanOrEqual(need);
    }
  });

  test("the run opens with candles only, then bugs, then flyers", () => {
    const { seen } = spawnAll(() => 0.01, 4000);
    const kinds = seen.map((o) => o.kind);
    expect(kinds.slice(0, DIFFICULTY.bugsFrom)).toEqual(Array(DIFFICULTY.bugsFrom).fill("candle"));
    // rng 0.01 always picks the rarest allowed kind.
    expect(kinds[DIFFICULTY.bugsFrom]).toBe("bug");
    expect(kinds[DIFFICULTY.flyersFrom]).toBe("flyer");
  });

  test("gaps tighten as the run goes on", () => {
    expect(level(0)).toBe(0);
    expect(level(DIFFICULTY.rampEnd / 2)).toBeCloseTo(0.5);
    expect(level(DIFFICULTY.rampEnd * 3)).toBe(1);
    const { seen } = spawnAll(() => 0.5, 8000);
    expect(seen.length).toBeGreaterThan(DIFFICULTY.rampEnd);
    const gapAt = (i: number) => seen[i].worldX - seen[i - 1].worldX;
    expect(gapAt(seen.length - 1) / DESKTOP.maxSpeed).toBeLessThan(gapAt(1) / DESKTOP.startSpeed);
  });

  test("a flyer hits a standing or jumping player but not a ducking one", () => {
    const base: GameState = { ...playing(), transition: 1, nextSpawnIn: 1e9 };
    const x = base.scroll + playerScreenX(base, DESKTOP);
    const withFlyer: GameState = { ...base, obstacles: [{ kind: "flyer", worldX: x, height: DESKTOP.flyerHeight, alt: DESKTOP.flyerBottom }] };
    const hit = step(withFlyer, DESKTOP, 0.001, rng);
    expect(hit.mode).toBe("over");
    expect(hit.hitBy).toBe("flyer");
    expect(step(duck(withFlyer, true), DESKTOP, 0.001, rng).mode).toBe("playing");
    const apex = DESKTOP.jumpVelocity ** 2 / (2 * DESKTOP.gravity);
    for (const h of [20, 80, apex]) {
      expect(step({ ...withFlyer, jumpHeight: h, grounded: false, velocity: 0 }, DESKTOP, 0.001, rng).mode).toBe("over");
    }
  });

  test("ducking blocks a jump and drops faster in the air", () => {
    const ducked = duck(playing(), true);
    expect(jump(ducked, DESKTOP)).toBe(ducked);
    const air = jump(playing(), DESKTOP);
    const normal = run(air, 0.3);
    const fast = run(duck(air, true), 0.3);
    expect(fast.jumpHeight).toBeLessThan(normal.jumpHeight);
    expect(duck(createGame(), true).ducking).toBe(false);
  });

  test("hitting a candle ends the game; clearing it does not", () => {
    const base: GameState = { ...playing(), transition: 1, nextSpawnIn: 1e9 };
    const x = base.scroll + playerScreenX(base, DESKTOP);
    const withCandle = { ...base, obstacles: [{ kind: "candle" as const, worldX: x, height: 100, alt: 0 }] };
    const hit = step(withCandle, DESKTOP, 0.001, rng);
    expect(hit.mode).toBe("over");
    expect(hit.hitBy).toBe("candle");
    const cleared = step({ ...withCandle, jumpHeight: 95, grounded: false, velocity: 0 }, DESKTOP, 0.001, rng);
    expect(cleared.mode).toBe("playing");
  });

  test("score is distance over 40 and restarting resets the run", () => {
    expect(score({ ...createGame(), distance: 1000 })).toBe(25);
    const over: GameState = { ...playing(), mode: "over", distance: 900, hitBy: "bug", obstacles: [{ kind: "bug", worldX: 5, height: 32, alt: 0 }] };
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
