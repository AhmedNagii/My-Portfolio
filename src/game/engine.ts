// Pure rules for the career game: no DOM, no clock, no randomness of its own.
import { DIFFICULTY, JUMP_BUFFER, MAX_DT, MAX_OBSTACLES, TRANSITION_RATE, type GameConfig } from "./config";

export type ObstacleKind = "candle" | "bug" | "flyer";
/** `alt` is how far above the ground the obstacle's lowest point is (0 on the ground). */
export type Obstacle = { kind: ObstacleKind; worldX: number; height: number; alt: number };

export type GameState = {
  mode: "idle" | "playing" | "over";
  /** 0 → 1 while the character runs from its resting spot to the play spot. */
  transition: number;
  speed: number;
  /** World x at the left edge of the screen. */
  scroll: number;
  distance: number;
  jumpHeight: number;
  velocity: number;
  grounded: boolean;
  ducking: boolean;
  jumpBuffer: number;
  /** Distance left until the next obstacle appears at the right edge. */
  nextSpawnIn: number;
  /** What the next obstacle will be; chosen early so the gap before it fits. */
  nextKind: ObstacleKind;
  spawned: number;
  obstacles: Obstacle[];
  hitBy: ObstacleKind | null;
};

export function createGame(): GameState {
  return {
    mode: "idle", transition: 0, speed: 0, scroll: 0, distance: 0,
    jumpHeight: 0, velocity: 0, grounded: true, ducking: false, jumpBuffer: 0,
    nextSpawnIn: 0, nextKind: "candle", spawned: 0, obstacles: [], hitBy: null,
  };
}

export function start(_s: GameState, c: GameConfig): GameState {
  return { ...createGame(), mode: "playing", speed: c.startSpeed, nextSpawnIn: 0.9 * c.width };
}

export function jump(s: GameState, c: GameConfig): GameState {
  if (s.mode !== "playing" || s.ducking) return s;
  if (s.grounded) return { ...s, velocity: c.jumpVelocity, grounded: false, jumpBuffer: 0 };
  return { ...s, jumpBuffer: JUMP_BUFFER };
}

/** Start or stop ducking. Ducking in the air drops faster. */
export function duck(s: GameState, on: boolean): GameState {
  if (s.mode !== "playing" || s.ducking === on) return s;
  return { ...s, ducking: on, jumpBuffer: on ? 0 : s.jumpBuffer };
}

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function playerScreenX(s: GameState, c: GameConfig): number {
  return c.width * (c.restX + (c.playerX - c.restX) * ease(s.transition));
}

export function score(s: GameState): number {
  return Math.floor(s.distance / 40);
}

/** 0 at the start of a run, 1 once the obstacle mix and gaps are at their hardest. */
export function level(spawned: number): number {
  return Math.min(1, spawned / DIFFICULTY.rampEnd);
}

export function airtime(c: GameConfig): number {
  return (2 * c.jumpVelocity) / c.gravity;
}

/**
 * The shortest gap, in seconds of running, that a player can always clear
 * between two obstacles: land before a jump, land and duck before a flyer,
 * get up and jump after one.
 */
export function minGap(prev: ObstacleKind, next: ObstacleKind, c: GameConfig): number {
  const { slack } = DIFFICULTY;
  if (prev !== "flyer") return airtime(c) + slack + (next === "flyer" ? 0.1 : 0);
  return next === "flyer" ? slack + 0.3 : 0.5 * airtime(c) + slack + 0.15;
}

function pickKind(spawned: number, rng: () => number): ObstacleKind {
  const t = level(spawned);
  const flyer = spawned >= DIFFICULTY.flyersFrom ? lerp(DIFFICULTY.flyerChance[0], DIFFICULTY.flyerChance[1], t) : 0;
  const bug = spawned >= DIFFICULTY.bugsFrom ? lerp(DIFFICULTY.bugChance[0], DIFFICULTY.bugChance[1], t) : 0;
  const r = rng();
  return r < flyer ? "flyer" : r < flyer + bug ? "bug" : "candle";
}

function makeObstacle(kind: ObstacleKind, worldX: number, c: GameConfig, rng: () => number): Obstacle {
  if (kind === "flyer") return { kind, worldX, height: c.flyerHeight, alt: c.flyerBottom };
  if (kind === "bug") return { kind, worldX, height: c.bugHeight, alt: 0 };
  return { kind, worldX, height: c.candleMinHeight + rng() * (c.candleMaxHeight - c.candleMinHeight), alt: 0 };
}

function halfWidth(o: Obstacle, c: GameConfig): number {
  if (o.kind === "candle") return c.candleWidth / 2 - 2;
  return o.kind === "bug" ? c.bugHalfWidth : c.flyerHalfWidth;
}

/** Does the runner, at this height and pose, overlap the obstacle vertically? */
function overlaps(o: Obstacle, s: Pick<GameState, "jumpHeight" | "ducking">, c: GameConfig): boolean {
  const m = c.collisionMargin;
  if (o.alt === 0) return s.jumpHeight < o.height - m;
  const top = s.jumpHeight + (s.ducking ? c.duckHeight : c.standHeight);
  // No margin on the top edge: a jump never clears a flyer, ducking is the answer.
  return top > o.alt + m && s.jumpHeight < o.alt + o.height;
}

export function step(s: GameState, c: GameConfig, dt: number, rng: () => number): GameState {
  if (s.mode !== "playing") return s;
  dt = Math.min(Math.max(dt, 0), MAX_DT);

  const speed = Math.min(c.maxSpeed, s.speed + c.acceleration * dt);
  const moved = speed * dt;
  const scroll = s.scroll + moved;
  const transition = Math.min(1, s.transition + TRANSITION_RATE * dt);

  // Physics, then the buffered jump if we just landed.
  let { velocity, jumpHeight, grounded, jumpBuffer } = s;
  if (!grounded) {
    velocity -= c.gravity * (s.ducking ? c.fastFall : 1) * dt;
    jumpHeight += velocity * dt;
    if (jumpHeight <= 0) {
      jumpHeight = 0;
      velocity = 0;
      grounded = true;
    }
  }
  if (grounded && jumpBuffer > 0 && !s.ducking) {
    velocity = c.jumpVelocity;
    grounded = false;
    jumpBuffer = 0;
  } else {
    jumpBuffer = Math.max(0, jumpBuffer - dt);
  }

  // Spawning starts once the intro run is over; positions are exact so gaps hold.
  let obstacles = s.obstacles.filter((o) => o.worldX - scroll > -60);
  let { nextSpawnIn, nextKind, spawned } = s;
  if (transition >= 1) {
    nextSpawnIn -= moved;
    while (nextSpawnIn <= 0) {
      const kind = nextKind;
      if (obstacles.length < MAX_OBSTACLES) {
        obstacles = [...obstacles, makeObstacle(kind, scroll + c.width + nextSpawnIn, c, rng)];
      }
      spawned += 1;
      nextKind = pickKind(spawned, rng);
      const t = level(spawned);
      const lo = lerp(DIFFICULTY.gapStart[0], DIFFICULTY.gapEnd[0], t);
      const hi = lerp(DIFFICULTY.gapStart[1], DIFFICULTY.gapEnd[1], t);
      nextSpawnIn += speed * Math.max(lo + rng() * (hi - lo), minGap(kind, nextKind, c));
    }
  }

  const next: GameState = {
    ...s, speed, scroll, transition, distance: s.distance + moved,
    velocity, jumpHeight, grounded, jumpBuffer, nextSpawnIn, nextKind, spawned, obstacles,
  };

  const px = playerScreenX(next, c);
  for (const o of obstacles) {
    const dx = o.worldX - scroll - px;
    if (Math.abs(dx) < halfWidth(o, c) + c.hitWidth * 0.55 && overlaps(o, next, c)) {
      return { ...next, mode: "over", hitBy: o.kind };
    }
  }
  return next;
}
