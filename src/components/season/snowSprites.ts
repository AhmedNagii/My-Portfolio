// Snow crystal images, drawn once into small offscreen canvases and then
// stamped (scaled and rotated) for every flake. Index matches Flake.shape.

const SIZE = 64;
const C = SIZE / 2;
const R = 28;

type Draw = (ctx: CanvasRenderingContext2D) => void;

/** Draws `arm` six times around the centre, 60° apart. */
const sixfold = (ctx: CanvasRenderingContext2D, arm: Draw) => {
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 3);
    arm(ctx);
    ctx.restore();
  }
};

const line = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

/** A side branch leaving the arm at `at` (0-1 along it), angled out ±60°. */
const branch = (ctx: CanvasRenderingContext2D, at: number, len: number) => {
  const y = -R * at;
  const dx = Math.sin(Math.PI / 3) * len;
  const dy = Math.cos(Math.PI / 3) * len;
  line(ctx, 0, y, dx, y - dy);
  line(ctx, 0, y, -dx, y - dy);
};

const SHAPES: Draw[] = [
  // Simple six-pointed star.
  (ctx) => {
    ctx.lineWidth = 4.5;
    sixfold(ctx, (c) => line(c, 0, 0, 0, -R));
  },
  // Dendrite: arms with two pairs of feathery branches.
  (ctx) => {
    ctx.lineWidth = 3.4;
    sixfold(ctx, (c) => {
      line(c, 0, 0, 0, -R);
      branch(c, 0.42, R * 0.32);
      branch(c, 0.7, R * 0.22);
    });
  },
  // Plate: a small hexagon in the middle, arms ending in a fork.
  (ctx) => {
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + Math.PI / 6;
      const r = R * 0.34;
      ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.stroke();
    sixfold(ctx, (c) => {
      line(c, 0, -R * 0.3, 0, -R);
      branch(c, 0.82, R * 0.2);
    });
  },
];

/** One canvas per crystal shape, white on transparent. */
export function makeSnowSprites(): HTMLCanvasElement[] {
  return SHAPES.map((draw) => {
    const el = document.createElement("canvas");
    el.width = el.height = SIZE;
    const ctx = el.getContext("2d");
    if (!ctx) return el;
    ctx.translate(C, C);
    ctx.strokeStyle = "#ffffff";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    draw(ctx);
    return el;
  });
}

/** Sprite pixels per flake radius: the crystal fills R of the sprite's C. */
export const SPRITE_SCALE = C / R;
