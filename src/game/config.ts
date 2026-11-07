// Tuning for the career game. Values come from the approved prototype.
export type GameConfig = {
  width: number;
  height: number;
  spriteScale: number;
  jumpVelocity: number;
  gravity: number;
  startSpeed: number;
  maxSpeed: number;
  acceleration: number;
  candleMinHeight: number;
  candleMaxHeight: number;
  candleWidth: number;
  bugHeight: number;
  bugHalfWidth: number;
  bugChance: number;
  gapMin: number;
  gapMax: number;
  hitWidth: number;
  collisionMargin: number;
  playerX: number;
  restX: number;
  baseline: number;
  wave1: number;
  wave2: number;
};

export const MAX_DT = 0.05;
export const MAX_OBSTACLES = 4;
export const JUMP_BUFFER = 0.12;
export const TRANSITION_RATE = 2.2;

export const DESKTOP: GameConfig = {
  width: 1360, height: 520, spriteScale: 0.7,
  jumpVelocity: 800, gravity: 1900,
  startSpeed: 340, maxSpeed: 680, acceleration: 14,
  candleMinHeight: 62, candleMaxHeight: 118, candleWidth: 22,
  bugHeight: 40, bugHalfWidth: 15, bugChance: 0.35,
  gapMin: 0.85, gapMax: 1.55,
  hitWidth: 25, collisionMargin: 8,
  playerX: 0.2, restX: 0.84, baseline: 0.74, wave1: 18, wave2: 9,
};

export const COMPACT: GameConfig = {
  width: 390, height: 340, spriteScale: 0.5,
  jumpVelocity: 570, gravity: 1500,
  startSpeed: 210, maxSpeed: 400, acceleration: 9,
  candleMinHeight: 42, candleMaxHeight: 76, candleWidth: 16,
  bugHeight: 32, bugHalfWidth: 12, bugChance: 0.35,
  gapMin: 0.95, gapMax: 1.7,
  hitWidth: 17, collisionMargin: 5,
  playerX: 0.2, restX: 0.8, baseline: 0.74, wave1: 11, wave2: 6,
};
