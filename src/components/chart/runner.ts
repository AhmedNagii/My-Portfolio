// The running character. The upper body is the character image clipped at the
// hips; the legs are SVG, posed every frame from a run cycle, a jump tuck and
// a crouch. All numbers are in sprite space (see SPRITE in geometry.ts).

export const HIP_Y = 176;
/** Where the image is cut; the leg tops sit just under it. */
export const BODY_CLIP_Y = 174;
export const GROUND_Y = 241;
const HIPS = [101, 113] as const; // front leg, back leg
const BODY_PIVOT_X = 108;
const THIGH = 23;
const SHIN = 19;
/** The shoe art is drawn at 1; the image's sneakers are a little chunkier. */
const SHOE_SCALE = 1.12;
/** Shoe outline with the ankle at 0,0 and the toe pointing forward (+x). */
export const SHOE = "M-11 -6L7 -6Q14 2 26 6Q34 9 33 16L33 19Q33 21 30 21L-10 21Q-13 21 -13 18Z";
const SOLE = [[-11, 21], [32, 21]].map(([x, y]) => [x * SHOE_SCALE, y * SHOE_SCALE] as const);

type Angles = { thigh: number; knee: number; foot: number };
type Pt = [number, number];
export type LegPose = { hip: Pt; knee: Pt; ankle: Pt; foot: number };
export type RunnerPose = { drop: number; lean: number; scale: number; legs: [LegPose, LegPose] };

const rad = (d: number) => (d * Math.PI) / 180;
const mixA = (a: Angles, b: Angles, t: number): Angles => ({
  thigh: a.thigh + (b.thigh - a.thigh) * t,
  knee: a.knee + (b.knee - a.knee) * t,
  foot: a.foot + (b.foot - a.foot) * t,
});

/** One leg of the run cycle at phase q: swings ±30°, knee folds on the way forward. */
function runLeg(q: number): Angles {
  const forward = Math.max(0, Math.cos(q));
  return { thigh: 30 * Math.sin(q), knee: 10 + 62 * forward, foot: 18 * forward };
}

const AIR: [Angles, Angles] = [
  { thigh: 50, knee: 85, foot: 20 },
  { thigh: -25, knee: 40, foot: 12 },
];
const CROUCH: [Angles, Angles] = [
  { thigh: 74, knee: 120, foot: 0 },
  { thigh: 60, knee: 112, foot: 4 },
];

function placeLeg(hipX: number, hipY: number, a: Angles): LegPose {
  const t = rad(a.thigh);
  const s = rad(a.thigh - a.knee);
  const knee: Pt = [hipX + THIGH * Math.sin(t), hipY + THIGH * Math.cos(t)];
  const ankle: Pt = [knee[0] + SHIN * Math.sin(s), knee[1] + SHIN * Math.cos(s)];
  return { hip: [hipX, hipY], knee, ankle, foot: a.foot };
}

/** Lowest point of the shoe below the hip. */
export function reach(leg: LegPose): number {
  const f = rad(leg.foot);
  const soles = SOLE.map(([x, y]) => leg.ankle[1] + x * Math.sin(f) + y * Math.cos(f));
  return Math.max(...soles) - leg.hip[1];
}

/**
 * The pose for run phase `phase`, how far into the air (`air`, 0–1) and into
 * a crouch (`crouch`, 0–1) the character is. On the ground the body drops so
 * the lowest foot touches the ground; in the air it hangs from the hips.
 */
export function runnerPose(phase: number, air: number, crouch: number): RunnerPose {
  const angles = ([0, Math.PI] as const).map((offset, i) => {
    const run = runLeg(phase + offset);
    return mixA(mixA(run, AIR[i], air), CROUCH[i], crouch);
  }) as [Angles, Angles];

  const draft = angles.map((a, i) => placeLeg(HIPS[i], HIP_Y, a));
  const standing = GROUND_Y - HIP_Y;
  const drop = (standing - Math.max(...draft.map(reach))) * (1 - air * (1 - crouch));
  const legs = angles.map((a, i) => placeLeg(HIPS[i], HIP_Y + drop, a)) as [LegPose, LegPose];

  return {
    drop,
    lean: 6 * (1 - air) - 4 * air + (45 - 6) * crouch,
    scale: 1 - 0.1 * crouch,
    legs,
  };
}

const f1 = (n: number) => n.toFixed(1);

export function legPath(leg: LegPose): string {
  return `M${f1(leg.hip[0])} ${f1(leg.hip[1])}L${f1(leg.knee[0])} ${f1(leg.knee[1])}L${f1(leg.ankle[0])} ${f1(leg.ankle[1])}`;
}

export function shoeTransform(leg: LegPose): string {
  return `translate(${f1(leg.ankle[0])} ${f1(leg.ankle[1])}) rotate(${f1(leg.foot)}) scale(${SHOE_SCALE})`;
}

export function bodyTransform(pose: RunnerPose): string {
  const { drop, lean, scale } = pose;
  return `translate(0 ${f1(drop)}) rotate(${f1(lean)} ${BODY_PIVOT_X} ${HIP_Y}) translate(${BODY_PIVOT_X} ${HIP_Y}) scale(${scale.toFixed(3)}) translate(${-BODY_PIVOT_X} ${-HIP_Y})`;
}

/** Elements the game writes the pose into. Index 0 is the front leg. */
export type RunnerEls = {
  legs?: SVGGElement | null;
  body?: SVGGElement | null;
  image?: SVGImageElement | null;
  outline?: SVGPathElement | null;
  limbs: { outline?: SVGPathElement | null; fill?: SVGPathElement | null; shoe?: SVGGElement | null; shoeEdge?: SVGPathElement | null }[];
};

type Limb = RunnerEls["limbs"][number];
type Part = Exclude<keyof RunnerEls, "limbs">;
/** Ref-callback factory: `bind("legs")`, or `bind("shoe", 0)` for a part of one leg. */
export type RunnerBind = {
  (part: Part): (el: SVGElement | null) => void;
  (part: keyof Limb, leg: number): (el: SVGElement | null) => void;
};

export function runnerBinder(e: RunnerEls): RunnerBind {
  return ((part: string, leg?: number) => (el: SVGElement | null) => {
    if (leg === undefined) Object.assign(e, { [part]: el });
    else e.limbs[leg] = { ...e.limbs[leg], [part]: el };
  }) as RunnerBind;
}

/** Writes a pose into the SVG, or with `null` shows the plain standing image. */
export function drawRunner(e: RunnerEls, pose: RunnerPose | null, clipId: string) {
  if (!pose) {
    if (e.legs) e.legs.style.display = "none";
    e.body?.removeAttribute("transform");
    e.image?.removeAttribute("clip-path");
    return;
  }
  if (e.legs) e.legs.style.display = "";
  e.image?.setAttribute("clip-path", `url(#${clipId})`);
  e.body?.setAttribute("transform", bodyTransform(pose));
  const paths = pose.legs.map(legPath);
  e.outline?.setAttribute("d", paths.join(""));
  pose.legs.forEach((leg, i) => {
    const limb = e.limbs[i];
    if (!limb) return;
    limb.outline?.setAttribute("d", paths[i]);
    limb.fill?.setAttribute("d", paths[i]);
    const t = shoeTransform(leg);
    limb.shoe?.setAttribute("transform", t);
    limb.shoeEdge?.setAttribute("transform", t);
  });
}
