// Falling snow and leaves for the hero. Pure: no DOM, no clock, rng injected.

/**
 * Snowflake shapes: 0 is a soft round speck (the far, small flakes); 1-3 are
 * six-armed crystals (a simple star, a branched dendrite, a plate with forked tips).
 */
export type FlakeShape = 0 | 1 | 2 | 3;
export const CRYSTAL_SHAPES = 3;
export type Flake = {
  x: number;
  y: number;
  r: number;
  vy: number;
  drift: number;
  phase: number;
  alpha: number;
  shape: FlakeShape;
  rot: number;
  spin: number;
};
export type Leaf = {
  x: number;
  y: number;
  size: number;
  vy: number;
  /** Side-to-side swing: amplitude in px, angular speed, and phase. */
  swing: number;
  freq: number;
  phase: number;
  spin: number;
  rot: number;
  color: string;
};

/** Autumn tones that sit next to the site's blue and green accents. */
export const LEAF_COLORS = ["#e3a23b", "#d9692b", "#b8462c", "#c98b2f", "#8f9a3e"];

/** Particles per pixel of area, and the caps that keep phones light. */
const FLAKE_DENSITY = 1 / 7000;
const LEAF_DENSITY = 1 / 26000;
export const MAX_FLAKES = 180;
export const MAX_LEAVES = 36;

export function flakeCount(w: number, h: number): number {
  return Math.min(MAX_FLAKES, Math.round(w * h * FLAKE_DENSITY));
}

export function leafCount(w: number, h: number): number {
  return Math.min(MAX_LEAVES, Math.max(6, Math.round(w * h * LEAF_DENSITY)));
}

/** Depth sets size, speed and brightness: far flakes are small round specks, near ones are crystals. */
function newFlake(w: number, h: number, rng: () => number, y?: number): Flake {
  const depth = rng();
  const crystal = depth > 0.45;
  return {
    x: rng() * w,
    y: y ?? rng() * h,
    shape: crystal ? ((1 + Math.floor(rng() * CRYSTAL_SHAPES)) as FlakeShape) : 0,
    r: crystal ? 3 + depth * 5 : 0.8 + depth * 2.6,
    rot: rng() * Math.PI * 2,
    spin: (rng() - 0.5) * 1.4,
    vy: 18 + depth * 46,
    drift: 6 + depth * 14,
    phase: rng() * Math.PI * 2,
    alpha: 0.35 + depth * 0.55,
  };
}

function newLeaf(w: number, h: number, rng: () => number, y?: number): Leaf {
  const size = 9 + rng() * 9;
  return {
    x: rng() * w,
    y: y ?? rng() * h,
    size,
    vy: 22 + rng() * 26,
    swing: 18 + rng() * 30,
    freq: 0.9 + rng() * 1.1,
    phase: rng() * Math.PI * 2,
    spin: (rng() - 0.5) * 2.4,
    rot: rng() * Math.PI * 2,
    color: LEAF_COLORS[Math.floor(rng() * LEAF_COLORS.length)],
  };
}

export function createFlakes(w: number, h: number, rng: () => number): Flake[] {
  return Array.from({ length: flakeCount(w, h) }, () => newFlake(w, h, rng));
}

export function createLeaves(w: number, h: number, rng: () => number): Leaf[] {
  return Array.from({ length: leafCount(w, h) }, () => newLeaf(w, h, rng));
}

const wrap = (x: number, w: number, pad: number) => (x < -pad ? x + w + 2 * pad : x > w + pad ? x - w - 2 * pad : x);

/** Advances flakes in place; ones that fall out the bottom restart above the top. */
export function stepFlakes(list: Flake[], dt: number, w: number, h: number, rng: () => number, wind = 0) {
  for (let i = 0; i < list.length; i++) {
    const f = list[i];
    f.phase += dt * 1.3;
    f.y += f.vy * dt;
    f.rot += f.spin * dt;
    f.x = wrap(f.x + (Math.sin(f.phase) * f.drift + wind) * dt, w, 4);
    if (f.y - f.r > h) list[i] = newFlake(w, h, rng, -f.r - rng() * 20);
  }
}

/** Leaves fall slower, swing like a pendulum and spin faster on the swing. */
export function stepLeaves(list: Leaf[], dt: number, w: number, h: number, rng: () => number, wind = 0) {
  for (let i = 0; i < list.length; i++) {
    const l = list[i];
    l.phase += dt * l.freq;
    const swingV = Math.cos(l.phase) * l.swing * l.freq;
    l.y += l.vy * dt * (0.75 + 0.25 * Math.abs(Math.sin(l.phase)));
    l.x = wrap(l.x + (swingV + wind) * dt, w, l.size * 2);
    l.rot += (l.spin + swingV * 0.012) * dt;
    if (l.y - l.size * 2 > h) list[i] = newLeaf(w, h, rng, -l.size * 2 - rng() * 30);
  }
}

/** Fits a particle list to a new size: keeps what still fits, tops up or trims. */
export function resizeFlakes(list: Flake[], w: number, h: number, rng: () => number): Flake[] {
  const n = flakeCount(w, h);
  const kept = list.slice(0, n).map((f) => (f.x > w ? { ...f, x: rng() * w } : f));
  while (kept.length < n) kept.push(newFlake(w, h, rng));
  return kept;
}

export function resizeLeaves(list: Leaf[], w: number, h: number, rng: () => number): Leaf[] {
  const n = leafCount(w, h);
  const kept = list.slice(0, n).map((l) => (l.x > w ? { ...l, x: rng() * w } : l));
  while (kept.length < n) kept.push(newLeaf(w, h, rng));
  return kept;
}
