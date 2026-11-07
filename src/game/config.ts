// Tuning for the career game.
export type GameConfig = {
  width: number;
  height: number;
  spriteScale: number;
  jumpVelocity: number;
  gravity: number;
  /** Gravity multiplier while ducking in the air (a fast drop). */
  fastFall: number;
  startSpeed: number;
  maxSpeed: number;
  acceleration: number;
  candleMinHeight: number;
  candleMaxHeight: number;
  candleWidth: number;
  bugHeight: number;
  bugHalfWidth: number;
  /** Flying obstacles: their lowest point above the ground, and their size. */
  flyerBottom: number;
  flyerHeight: number;
  flyerHalfWidth: number;
  /** Collision height of the runner standing and ducking. */
  standHeight: number;
  duckHeight: number;
  hitWidth: number;
  collisionMargin: number;
  playerX: number;
  restX: number;
  baseline: number;
  wave1: number;
  wave2: number;
};

export const MAX_DT = 0.05;
export const MAX_OBSTACLES = 6;
export const JUMP_BUFFER = 0.12;
export const TRANSITION_RATE = 2.2;

/**
 * Difficulty ramps with the number of obstacles spawned, so phone and desktop
 * get harder at the same pace. The first obstacles are all candles, bugs join
 * at `bugsFrom`, flyers at `flyersFrom`, and by `rampEnd` gaps are at their
 * tightest and the mix at its hardest. Speed ramps separately, with time.
 */
export const DIFFICULTY = {
  bugsFrom: 3,
  flyersFrom: 6,
  rampEnd: 40,
  bugChance: [0.25, 0.3],
  flyerChance: [0.2, 0.32],
  /** Seconds between obstacles at the start and at the end of the ramp. */
  gapStart: [1.25, 2.0],
  gapEnd: [0.8, 1.35],
  /** Reaction time added on top of the physical minimum between obstacles. */
  slack: 0.12,
} as const;

export const DESKTOP: GameConfig = {
  width: 1360, height: 520, spriteScale: 0.7,
  jumpVelocity: 800, gravity: 1900, fastFall: 3,
  startSpeed: 330, maxSpeed: 700, acceleration: 8,
  candleMinHeight: 62, candleMaxHeight: 118, candleWidth: 22,
  bugHeight: 40, bugHalfWidth: 15,
  flyerBottom: 140, flyerHeight: 34, flyerHalfWidth: 26,
  standHeight: 176, duckHeight: 124,
  hitWidth: 25, collisionMargin: 8,
  playerX: 0.2, restX: 0.84, baseline: 0.74, wave1: 18, wave2: 9,
};

export const COMPACT: GameConfig = {
  width: 390, height: 340, spriteScale: 0.5,
  jumpVelocity: 570, gravity: 1500, fastFall: 3,
  startSpeed: 205, maxSpeed: 410, acceleration: 5,
  candleMinHeight: 42, candleMaxHeight: 76, candleWidth: 16,
  bugHeight: 32, bugHalfWidth: 12,
  flyerBottom: 100, flyerHeight: 26, flyerHalfWidth: 19,
  standHeight: 126, duckHeight: 88,
  hitWidth: 17, collisionMargin: 5,
  playerX: 0.2, restX: 0.8, baseline: 0.74, wave1: 11, wave2: 6,
};
