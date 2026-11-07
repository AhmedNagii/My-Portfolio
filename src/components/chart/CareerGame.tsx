"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { COMPACT, DESKTOP, TRANSITION_RATE, type GameConfig } from "@/game/config";
import { careerY, terrainY } from "@/game/curves";
import { createGame, jump, playerScreenX, score, start, step, type GameState } from "@/game/engine";
import { browserStorage, readBest, writeBest } from "@/game/storage";
import { ChartArt, areaPath, playerTransform, type ChartNodes } from "./ChartArt";
import { GameOver } from "./GameOver";
import { linePath, SPRITE } from "./geometry";
import { useGameLoop } from "./useGameLoop";

type Mode = "idle" | "playing" | "over" | "closing";
type Els = {
  line?: SVGPathElement | null;
  area?: SVGPathElement | null;
  decor?: SVGGElement | null;
  labels?: SVGGElement | null;
  player?: SVGGElement | null;
  sprite?: SVGGElement | null;
  score?: HTMLSpanElement | null;
  slots: { root?: SVGGElement | null; candle?: SVGGElement | null; wick?: SVGPathElement | null; body?: SVGRectElement | null; bug?: SVGGElement | null }[];
};

// rem, like Tailwind's sm: (40rem), so JS and CSS agree at any default font size.
const BREAKPOINT = "(min-width: 40rem)";

function subscribeWidth(onChange: () => void) {
  const mq = window.matchMedia(BREAKPOINT);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const isCompact = () => !window.matchMedia(BREAKPOINT).matches;
const onServer = () => null;
const SLOTS = [0, 1, 2, 3];

/** The career chart; press Play and it becomes a side-scrolling jump game. */
export function CareerGame() {
  // null until mounted: the server renders both sizes and CSS shows one.
  const compact = useSyncExternalStore<boolean | null>(subscribeWidth, isCompact, onServer);
  const [mode, setMode] = useState<Mode>("idle");
  const [best, setBest] = useState(0);
  const [result, setResult] = useState({ score: 0, message: "" });

  const box = useRef<HTMLDivElement>(null);
  const playBtn = useRef<HTMLButtonElement>(null);
  const jumpBtn = useRef<HTMLButtonElement>(null);
  const g = useRef<GameState>(createGame());
  const runPhase = useRef(0);
  const els = useRef<Els>({ slots: SLOTS.map(() => ({})) });
  const c: GameConfig = compact ? COMPACT : DESKTOP;


  const nodes = useMemo<ChartNodes>(
    () => ({
      line: (e) => void (els.current.line = e),
      area: (e) => void (els.current.area = e),
      decor: (e) => void (els.current.decor = e),
      labels: (e) => void (els.current.labels = e),
      player: (e) => void (els.current.player = e),
      sprite: (e) => void (els.current.sprite = e),
    }),
    [],
  );

  /** Writes the current game state into the SVG. No React render involved. */
  const draw = useCallback(() => {
    const s = g.current;
    const e = els.current;
    const t = s.transition;
    const curve = (x: number) => {
      const a = careerY(x, c);
      return t <= 0 ? a : a + (terrainY(x + s.scroll, c) - a) * t;
    };
    const line = linePath(curve, c.width, compact ? 6 : 10);
    e.line?.setAttribute("d", line);
    e.area?.setAttribute("d", areaPath(line, c));
    if (e.line) e.line.style.stroke = s.mode === "over" ? "var(--color-down)" : "";

    const fade = String(Math.max(0, 1 - t * 3));
    if (e.decor) e.decor.style.opacity = fade;
    if (e.labels) {
      e.labels.style.opacity = fade;
      e.labels.style.display = t > 0.34 ? "none" : "";
    }

    const running = s.mode === "playing";
    const px = playerScreenX(s, c);
    const bob = running && s.grounded ? Math.abs(Math.sin(runPhase.current)) * 5 * c.spriteScale : 0;
    e.player?.setAttribute("transform", playerTransform(px, curve(px) - s.jumpHeight - bob, c));
    const tilt = s.mode === "over" ? 16 : !running ? 0 : s.grounded ? Math.sin(runPhase.current) * 4 : -9;
    e.sprite?.setAttribute("transform", `rotate(${tilt.toFixed(1)} ${SPRITE.anchorX} ${SPRITE.anchorY})`);
    if (e.score) e.score.textContent = String(score(s));

    e.slots.forEach((slot, i) => {
      const o = s.obstacles[i];
      if (!slot.root) return;
      if (!o) {
        slot.root.style.display = "none";
        return;
      }
      slot.root.style.display = "";
      const bug = o.kind === "bug";
      slot.root.setAttribute("transform", `translate(${(o.worldX - s.scroll).toFixed(1)} ${terrainY(o.worldX, c).toFixed(1)})${bug && compact ? " scale(.8)" : ""}`);
      if (slot.candle) slot.candle.style.display = bug ? "none" : "";
      if (slot.bug) slot.bug.style.display = bug ? "" : "none";
      if (!bug && slot.body && slot.wick) {
        const bodyH = o.height * 0.78;
        slot.body.setAttribute("x", String(-c.candleWidth / 2));
        slot.body.setAttribute("width", String(c.candleWidth));
        slot.body.setAttribute("y", (-bodyH - o.height * 0.04).toFixed(1));
        slot.body.setAttribute("height", bodyH.toFixed(1));
        slot.wick.setAttribute("d", `M0 0V${(-o.height).toFixed(0)}`);
      }
    });
  }, [c, compact]);

  const onFrame = useCallback(
    (dt: number) => {
      const s = g.current;
      if (s.mode === "idle") {
        // Closing: run back to the resting spot, then stop.
        const transition = Math.max(0, s.transition - TRANSITION_RATE * Math.min(dt, 0.05));
        g.current = { ...s, transition };
        draw();
        if (transition > 0) return true;
        setMode("idle");
        return false;
      }
      runPhase.current += dt * (s.speed / (compact ? 22 : 34));
      const next = step(s, c, dt, Math.random);
      g.current = next;
      draw();
      if (next.mode === "over") {
        const final = score(next);
        setResult({ score: final, message: next.hitBy === "bug" ? "Build failed" : "Stopped out" });
        setBest((b) => {
          if (final <= b) return b;
          writeBest(final, browserStorage());
          return final;
        });
        setMode("over");
        return false;
      }
      return true;
    },
    [c, compact, draw],
  );

  useGameLoop(onFrame, mode === "playing" || mode === "closing", box);

  const play = () => {
    const prev = g.current;
    if (prev.mode === "idle") setBest((b) => Math.max(b, readBest(browserStorage())));
    // Keep the scroll and the run-in so Play again continues from where the line is.
    g.current = { ...start(prev, c), transition: prev.transition, scroll: prev.scroll };
    setMode("playing");
  };

  const close = () => {
    g.current = { ...g.current, mode: "idle", obstacles: [], jumpHeight: 0 };
    draw();
    setMode("closing");
  };

  // A size change mid-run resets to the chart at rest.
  const seenCompact = useRef(compact);
  useEffect(() => {
    if (seenCompact.current === compact) return;
    seenCompact.current = compact;
    g.current = createGame();
    draw();
    setMode("idle");
  }, [compact, draw]);

  useEffect(() => {
    if (mode === "playing") jumpBtn.current?.focus({ preventScroll: true });
  }, [mode]);

  const closed = useRef(false);
  useEffect(() => {
    if (mode === "closing") closed.current = true;
    if (mode === "idle" && closed.current) {
      closed.current = false;
      playBtn.current?.focus({ preventScroll: true });
    }
  }, [mode]);

  const doJump = () => {
    g.current = jump(g.current, c);
  };

  const obstacles = (
    <g aria-hidden="true">
      {SLOTS.map((i) => (
        <g key={i} ref={(e) => void (els.current.slots[i].root = e)} style={{ display: "none" }}>
          <g ref={(e) => void (els.current.slots[i].candle = e)}>
            <path ref={(e) => void (els.current.slots[i].wick = e)} d="M0 0V-80" stroke="var(--color-down)" strokeWidth={3.5} strokeLinecap="round" />
            <rect ref={(e) => void (els.current.slots[i].body = e)} x={-11} y={-60} width={22} height={60} rx={compact ? 5 : 8} fill="var(--color-down)" />
          </g>
          <g ref={(e) => void (els.current.slots[i].bug = e)} style={{ display: "none" }}>
            <path d="M-20 -6 L-30 -2 M-20 -17 L-31 -19 M-16 -27 L-25 -35 M20 -6 L30 -2 M20 -17 L31 -19 M16 -27 L25 -35 M-6 -36 L-11 -46 M6 -36 L11 -46" stroke="var(--color-text)" strokeWidth={3} strokeLinecap="round" fill="none" />
            <ellipse cx={0} cy={-19} rx={21} ry={19} fill="var(--color-down)" />
            <path d="M0 -38V0" stroke="var(--color-bg)" strokeWidth={2.5} />
            <circle cx={-9} cy={-24} r={3.5} fill="var(--color-bg)" />
            <circle cx={9} cy={-24} r={3.5} fill="var(--color-bg)" />
            <circle cx={-9} cy={-11} r={3} fill="var(--color-bg)" />
            <circle cx={9} cy={-11} r={3} fill="var(--color-bg)" />
          </g>
        </g>
      ))}
    </g>
  );

  const edge = compact ? "16px" : "40px";

  return (
    <div ref={box} className="relative overflow-hidden">
      <div className="sm:hidden">
        <ChartArt config={COMPACT} compact animate nodes={compact === true ? nodes : undefined}>
          {compact === true && obstacles}
        </ChartArt>
      </div>
      <div className="hidden sm:block">
        <ChartArt config={DESKTOP} compact={false} animate nodes={compact === false ? nodes : undefined}>
          {compact === false && obstacles}
        </ChartArt>
      </div>

      {compact !== null && mode === "idle" && (
        <button
          ref={playBtn}
          type="button"
          onClick={play}
          className="absolute flex min-h-11 -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full bg-accent px-5 text-[15px] font-bold text-bg transition-opacity hover:opacity-85"
          style={{ left: `${c.restX * 100}%`, top: compact ? "62%" : "58%" }}
        >
          <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true">
            <path d="M1.5 1.5L10.5 7L1.5 12.5Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          Play
        </button>
      )}

      {(mode === "playing" || mode === "over") && (
        <div aria-live="off" className="pointer-events-none absolute flex gap-3.5 font-mono text-[13px] font-medium" style={{ right: edge, top: compact ? "8px" : "20px" }}>
          <span>
            Commits <span ref={(e) => void (els.current.score = e)}>{mode === "over" ? result.score : 0}</span>
          </span>
          <span className="text-muted">Best {best}</span>
        </div>
      )}

      {mode === "playing" && (
        <>
          <button
            ref={jumpBtn}
            type="button"
            aria-label="Jump"
            className="absolute inset-0 size-full cursor-pointer touch-manipulation bg-transparent outline-none"
            onPointerDown={(e) => {
              e.preventDefault();
              // preventDefault also blocks focus; take it back so Space keeps jumping.
              e.currentTarget.focus({ preventScroll: true });
              doJump();
            }}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                doJump();
              }
            }}
          />
          <p className="pointer-events-none absolute text-[13px] text-muted" style={{ left: edge, bottom: compact ? "4px" : "12px" }}>
            {compact ? "Tap to jump" : "Space or click to jump"}
          </p>
        </>
      )}

      {mode === "over" && <GameOver message={result.message} score={result.score} best={best} onAgain={play} onClose={close} />}
    </div>
  );
}
