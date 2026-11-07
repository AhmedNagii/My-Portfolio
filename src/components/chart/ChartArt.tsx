import type { GameConfig } from "@/game/config";
import { careerY } from "@/game/curves";
import { linePath, milestone, MILESTONES, restCandles, SPRITE, WICK } from "./geometry";
import { BODY_CLIP_Y, SHOE, type RunnerBind } from "./runner";

type Bind<T> = (el: T | null) => void;
/** Callback refs the game uses to drive the drawing between React renders. */
export type ChartNodes = Partial<{
  line: Bind<SVGPathElement>;
  area: Bind<SVGPathElement>;
  decor: Bind<SVGGElement>;
  labels: Bind<SVGGElement>;
  player: Bind<SVGGElement>;
  sprite: Bind<SVGGElement>;
  /** Binds the runner's legs and body as they mount. */
  runner: RunnerBind;
}>;

export const ARIA_LABEL =
  "A rising line showing Ahmed's career from Solve-IT in 2022 to Serva in 2026, with a cartoon of him at the latest point.";

export function areaPath(line: string, c: GameConfig): string {
  return `${line}L${c.width} ${c.height}L0 ${c.height}Z`;
}

export function playerTransform(px: number, py: number, c: GameConfig): string {
  const s = c.spriteScale;
  return `translate(${(px - SPRITE.anchorX * s).toFixed(1)} ${(py - SPRITE.anchorY * s).toFixed(1)}) scale(${s})`;
}

/**
 * The career chart at rest: candles, the rising line, two milestones and the
 * character. Plain SVG so it renders without JavaScript; the load animation
 * is CSS (see globals.css) and is skipped under reduced motion. The game
 * drives the same nodes through `nodes` and draws obstacles as `children`.
 */
export function ChartArt({
  config: c,
  compact,
  animate,
  nodes = {},
  children,
}: {
  config: GameConfig;
  compact: boolean;
  animate: boolean;
  nodes?: ChartNodes;
  children?: React.ReactNode;
}) {
  const { line: lineRef, area: areaRef, decor: decorRef, labels: labelsRef, player: playerRef, sprite: spriteRef, runner } = nodes;
  const id = compact ? "fade-c" : "fade-d";
  const line = linePath((x) => careerY(x, c), c.width, compact ? 6 : 10);
  const px = c.width * c.restX;
  const a = animate ? "chart-animate" : "";

  return (
    <svg viewBox={`0 0 ${c.width} ${c.height}`} role="img" aria-label={ARIA_LABEL} className={`block h-auto w-full ${a}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-accent)" stopOpacity="0.16" />
          <stop offset="1" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
        <clipPath id={bodyClipId(compact)}>
          <rect x={0} y={-40} width={260} height={BODY_CLIP_Y + 40} />
        </clipPath>
      </defs>
      <g ref={decorRef}>
        <g opacity={0.8}>
          {restCandles(c, compact).map((k, i) => {
            const cx = k.x + k.width / 2;
            const color = k.up ? "var(--color-up)" : "var(--color-down)";
            const origin = ((WICK + 0.62 * k.height) / (k.height + 2 * WICK)) * 100;
            return (
              <g key={i} className="chart-candle" style={{ transformOrigin: `50% ${origin.toFixed(1)}%`, animationDelay: `${0.25 + i * 0.06}s` }}>
                <path d={`M${cx.toFixed(1)} ${(k.top - WICK).toFixed(1)}V${(k.top + k.height + WICK).toFixed(1)}`} stroke={color} strokeWidth={3} strokeLinecap="round" />
                <rect x={k.x.toFixed(1)} y={k.top.toFixed(1)} width={k.width} height={k.height} rx={k.radius} fill={color} />
              </g>
            );
          })}
        </g>
      </g>
      <path ref={areaRef} d={areaPath(line, c)} fill={`url(#${id})`} className="chart-fade" />
      <path
        ref={lineRef}
        d={line}
        pathLength={1}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="chart-line"
      />
      <g ref={labelsRef} className="chart-fade" aria-hidden="true">
        {MILESTONES[compact ? "compact" : "desktop"].map((m) => {
          const p = milestone(m.at, c);
          return (
            <g key={m.name}>
              <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={7} fill="var(--color-bg)" stroke="var(--color-accent)" strokeWidth={3.5} />
              <text x={p.x.toFixed(1)} y={(p.y - 40).toFixed(1)} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--color-text)">
                {m.name}
              </text>
              <text x={p.x.toFixed(1)} y={(p.y - 22).toFixed(1)} textAnchor="middle" fontSize={12} fill="var(--color-muted)" className="font-mono">
                {m.year}
              </text>
            </g>
          );
        })}
      </g>
      {children}
      <g ref={playerRef} data-player="" transform={playerTransform(px, careerY(px, c), c)}>
        <g ref={spriteRef} className="chart-sprite">
          <RunnerLegs bind={runner} />
          <g ref={runner?.("body")}>
            <image
              ref={runner?.("image")}
              href="/character.webp"
              x={SPRITE.x}
              y={SPRITE.y}
              width={SPRITE.width}
              height={SPRITE.height}
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

export const bodyClipId = (compact: boolean) => (compact ? "body-c" : "body-d");

// The character's own palette, sampled from the image, not theme colors.
const INK = "#0f1014";
const PANTS = "#22262b";
const SHOE_FILL = "#2d3036";
const RIM = "#307ef2";
const STRIPE = "#0eb35b";
const SOLE = "#fdffff";

/** SVG legs for the running pose. Hidden until the game poses them. */
function RunnerLegs({ bind }: { bind?: RunnerBind }) {
  // Back leg (1) first so the front leg (0) overlaps it. The blue rim goes
  // under everything so it only shows on the outside of the silhouette.
  return (
    <g ref={bind?.("legs")} style={{ display: "none" }} aria-hidden="true">
      <path ref={bind?.("outline")} fill="none" stroke={RIM} strokeWidth={29} strokeLinecap="round" strokeLinejoin="round" />
      {[1, 0].map((i) => (
        <path key={i} ref={bind?.("shoeEdge", i)} d={SHOE} fill={RIM} stroke={RIM} strokeWidth={9.5} strokeLinejoin="round" />
      ))}
      {[1, 0].map((i) => (
        <g key={i}>
          <path ref={bind?.("outline", i)} fill="none" stroke={INK} strokeWidth={24.5} strokeLinecap="round" strokeLinejoin="round" />
          <path ref={bind?.("fill", i)} fill="none" stroke={PANTS} strokeWidth={19} strokeLinecap="round" strokeLinejoin="round" />
          <g ref={bind?.("shoe", i)}>
            <path d={SHOE} fill={SHOE_FILL} stroke={INK} strokeWidth={5} strokeLinejoin="round" paintOrder="stroke" />
            <path d="M-10 17.5H30" stroke={SOLE} strokeWidth={2.4} strokeLinecap="round" />
            <path d="M0 6L10 10M2 11L12 14.5" stroke={STRIPE} strokeWidth={2.6} strokeLinecap="round" />
          </g>
        </g>
      ))}
    </g>
  );
}
