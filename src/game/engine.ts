// Pure rules for the career game: no DOM, no clock, no randomness of its own.
import { JUMP_BUFFER, MAX_DT, MAX_OBSTACLES, TRANSITION_RATE, type GameConfig } from "./config";

export type ObstacleKind = "candle" | "bug";
export type Obstacle = { kind: ObstacleKind; worldX: number; height: number };

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
  jumpBuffer: number;
  /** Distance left until the next obstacle appears at the right edge. */
  nextSpawnIn: number;
  obstacles: Obstacle[];
  hitBy: ObstacleKind | null;
};

export function createGame(): GameState {
  return {
    mode: "idle", transition: 0, speed: 0, scroll: 0, distance: 0,
    jumpHeight: 0, velocity: 0, grounded: true, jumpBuffer: 0,
    nextSpawnIn: 0, obstacles: [], hitBy: null,
  };
}

export function start(_s: GameState, c: GameConfig): GameState {
  return { ...createGame(), mode: "playing", speed: c.startSpeed, nextSpawnIn: 0.9 * c.width };
}

export function jump(s: GameState, c: GameConfig): GameState {
  if (s.mode !== "playing") return s;
  if (s.grounded) return { ...s, velocity: c.jumpVelocity, grounded: false, jumpBuffer: 0 };
  return { ...s, jumpBuffer: JUMP_BUFFER };
}

const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export function playerScreenX(s: GameState, c: GameConfig): number {
  return c.width * (c.restX + (c.playerX - c.restX) * ease(s.transition));
}

export function score(s: GameState): number {
  return Math.floor(s.distance / 40);
}

function halfWidth(o: Obstacle, c: GameConfig): number {
  return o.kind === "candle" ? c.candleWidth / 2 - 2 : c.bugHalfWidth;
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
    velocity -= c.gravity * dt;
    jumpHeight += velocity * dt;
    if (jumpHeight <= 0) {
      jumpHeight = 0;
      velocity = 0;
      grounded = true;
    }
  }
  if (grounded && jumpBuffer > 0) {
    velocity = c.jumpVelocity;
    grounded = false;
    jumpBuffer = 0;
  } else {
    jumpBuffer = Math.max(0, jumpBuffer - dt);
  }

  // Spawning starts once the intro run is over; positions are exact so gaps hold.
  let obstacles = s.obstacles.filter((o) => o.worldX - scroll > -60);
  let nextSpawnIn = s.nextSpawnIn;
  if (transition >= 1) {
    nextSpawnIn -= moved;
    while (nextSpawnIn <= 0) {
      if (obstacles.length < MAX_OBSTACLES) {
        const kind: ObstacleKind = rng() < c.bugChance ? "bug" : "candle";
        const height = kind === "bug" ? c.bugHeight : c.candleMinHeight + rng() * (c.candleMaxHeight - c.candleMinHeight);
        obstacles = [...obstacles, { kind, worldX: scroll + c.width + nextSpawnIn, height }];
      }
      const airtime = (2 * c.jumpVelocity) / c.gravity + 0.12;
      nextSpawnIn += speed * Math.max(c.gapMin + rng() * (c.gapMax - c.gapMin), airtime);
    }
  }

  const next: GameState = {
    ...s, speed, scroll, transition, distance: s.distance + moved,
    velocity, jumpHeight, grounded, jumpBuffer, nextSpawnIn, obstacles,
  };

  const px = playerScreenX(next, c);
  for (const o of obstacles) {
    const dx = o.worldX - scroll - px;
    if (Math.abs(dx) < halfWidth(o, c) + c.hitWidth * 0.55 && jumpHeight < o.height - c.collisionMargin) {
      return { ...next, mode: "over", hitBy: o.kind };
    }
  }
  return next;
}
