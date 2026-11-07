"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { COMPACT, DESKTOP, TRANSITION_RATE, type GameConfig } from "@/game/config";
import { careerY, terrainY } from "@/game/curves";
import { createGame, duck, jump, playerScreenX, score, start, step, type GameState, type ObstacleKind } from "@/game/engine";
import { browserStorage, readBest, writeBest } from "@/game/storage";
import { ChartArt, areaPath, bodyClipId, playerTransform, type ChartNodes } from "./ChartArt";
import { GameOver } from "./GameOver";
import { linePath, SPRITE } from "./geometry";
import { drawRunner, runnerBinder, runnerPose, type RunnerEls } from "./runner";
import { useGameLoop } from "./useGameLoop";

type Mode = "idle" | "playing" | "over" | "closing";
type Slot = {
  root?: SVGGElement | null;
  candle?: SVGGElement | null;
  wick?: SVGPathElement | null;
  body?: SVGRectElement | null;
  bug?: SVGGElement | null;
  flyer?: SVGGElement | null;
};
type Els = {
  line?: SVGPathElement | null;
  area?: SVGPathElement | null;
  decor?: SVGGElement | null;
  labels?: SVGGElement | null;
  player?: SVGGElement | null;
  sprite?: SVGGElement | null;
  score?: HTMLSpanElement | null;
  slots: Slot[];
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
const SLOTS = [0, 1, 2, 3, 4, 5];

const MESSAGES: Record<ObstacleKind, string> = {
  candle: "Stopped out",
  bug: "Build failed",
  flyer: "Scope creep",
};

const JUMP_KEYS = new Set([" ", "Enter", "ArrowUp", "w", "W"]);
const DUCK_KEYS = new Set(["ArrowDown", "s", "S"]);
/** How far a finger must travel to count as a swipe, and how long a tap may wait. */
const SWIPE_PX = 16;
const TAP_WAIT_MS = 110;

/** Moves `value` toward `target` by at most `rate * dt`. */
const approach = (value: number, target: number, rate: number, dt: number) =>
  value < target ? Math.min(target, value + rate * dt) : Math.max(target, value - rate * dt);

/** The career chart; press Play and it becomes a side-scrolling runner. */
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
  /** Animation-only state: run cycle phase and smoothed air and crouch amounts. */
  const anim = useRef({ phase: 0, air: 0, crouch: 0 });
  const touch = useRef<{ id: number; y: number; timer: number; decided: boolean } | null>(null);
  const els = useRef<Els>({ slots: SLOTS.map(() => ({})) });
  // A stable holder the legs' ref callbacks fill in; read only while drawing.
  const [runnerEls] = useState<RunnerEls>(() => ({ limbs: [] }));
  const c: GameConfig = compact ? COMPACT : DESKTOP;

  const nodes = useMemo<ChartNodes>(
    () => ({
      line: (e) => void (els.current.line = e),
      area: (e) => void (els.current.area = e),
      decor: (e) => void (els.current.decor = e),
      labels: (e) => void (els.current.labels = e),
      player: (e) => void (els.current.player = e),
      sprite: (e) => void (els.current.sprite = e),
      runner: runnerBinder(runnerEls),
    }),
    [runnerEls],
  );

  /** Writes the current game state into the SVG. No React render involved. */
  const draw = useCallback(() => {
    const s = g.current;
    const e = els.current;
    const a = anim.current;
    const t = s.transition;
    const curve = (x: number) => {
      const y = careerY(x, c);
      return t <= 0 ? y : y + (terrainY(x + s.scroll, c) - y) * t;
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

    // At rest the character is the plain image; once it moves it gets legs.
    const moving = s.mode !== "idle" || t > 0;
    const px = playerScreenX(s, c);
    e.player?.setAttribute("transform", playerTransform(px, curve(px) - s.jumpHeight, c));
    e.sprite?.setAttribute("transform", s.mode === "over" ? `rotate(16 ${SPRITE.anchorX} ${SPRITE.anchorY})` : "");
    drawRunner(runnerEls, moving ? runnerPose(a.phase, a.air, a.crouch) : null, bodyClipId(!!compact));
    if (e.score) e.score.textContent = String(score(s));

    e.slots.forEach((slot, i) => {
      const o = s.obstacles[i];
      if (!slot.root) return;
      if (!o) {
        slot.root.style.display = "none";
        return;
      }
      slot.root.style.display = "";
      const x = (o.worldX - s.scroll).toFixed(1);
      const y = (terrainY(o.worldX, c) - o.alt).toFixed(1);
      const small = compact && o.kind !== "candle" ? ` scale(${o.kind === "flyer" ? 0.76 : 0.8})` : "";
      slot.root.setAttribute("transform", `translate(${x} ${y})${small}`);
      if (slot.candle) slot.candle.style.display = o.kind === "candle" ? "" : "none";
      if (slot.bug) slot.bug.style.display = o.kind === "bug" ? "" : "none";
      if (slot.flyer) slot.flyer.style.display = o.kind === "flyer" ? "" : "none";
      if (o.kind === "candle" && slot.body && slot.wick) {
        const bodyH = o.height * 0.78;
        slot.body.setAttribute("x", String(-c.candleWidth / 2));
        slot.body.setAttribute("width", String(c.candleWidth));
        slot.body.setAttribute("y", (-bodyH - o.height * 0.04).toFixed(1));
        slot.body.setAttribute("height", bodyH.toFixed(1));
        slot.wick.setAttribute("d", `M0 0V${(-o.height).toFixed(0)}`);
      }
    });
  }, [c, compact, runnerEls]);

  const onFrame = useCallback(
    (dt: number) => {
      const s = g.current;
      const a = anim.current;
      const frameDt = Math.min(dt, 0.05);
      if (s.mode === "idle") {
        // Closing: run back to the resting spot, then stop.
        const transition = Math.max(0, s.transition - TRANSITION_RATE * frameDt);
        g.current = { ...s, transition };
        a.phase += frameDt * 13;
        a.air = approach(a.air, 0, 14, frameDt);
        a.crouch = approach(a.crouch, 0, 18, frameDt);
        draw();
        if (transition > 0) return true;
        setMode("idle");
        return false;
      }
      const next = step(s, c, dt, Math.random);
      g.current = next;
      // Stride rate follows the ground speed so the feet don't skate.
      a.phase += frameDt * (next.speed / (compact ? 15 : 24));
      a.air = approach(a.air, next.grounded ? 0 : 1, 14, frameDt);
      a.crouch = approach(a.crouch, next.ducking ? 1 : 0, 18, frameDt);
      draw();
      if (next.mode === "over") {
        const final = score(next);
        setResult({ score: final, message: MESSAGES[next.hitBy ?? "candle"] });
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
    anim.current = { ...anim.current, air: 0, crouch: 0 };
    setMode("playing");
  };

  const close = () => {
    g.current = { ...g.current, mode: "idle", obstacles: [], jumpHeight: 0, ducking: false };
    draw();
    setMode("closing");
  };

  // A size change mid-run resets to the chart at rest.
  const seenCompact = useRef(compact);
  useEffect(() => {
    if (seenCompact.current === compact) return;
    seenCompact.current = compact;
    g.current = createGame();
    anim.current = { phase: 0, air: 0, crouch: 0 };
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
  const setDuck = (on: boolean) => {
    g.current = duck(g.current, on);
  };

  // Touch: a tap jumps, a swipe down ducks until the finger lifts. A finger
  // that hasn't moved after TAP_WAIT_MS is a tap, so a held press still jumps.
  const endTouch = () => {
    const t = touch.current;
    if (!t) return;
    window.clearTimeout(t.timer);
    touch.current = null;
    if (!t.decided) doJump();
    setDuck(false);
  };

  const flyer = (
    <g>
      <path d="M34 -27H48M30 -17H50M36 -7H45" stroke="var(--color-muted)" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      <path d="M-27 -18L27 -34L8 -15Z" fill="var(--color-down)" />
      <path d="M-27 -18L8 -15L18 0Z" fill="var(--color-down)" opacity={0.72} />
      <path d="M-27 -18L8 -15" stroke="var(--color-bg)" strokeWidth={2} strokeLinecap="round" />
    </g>
  );

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
          <g ref={(e) => void (els.current.slots[i].flyer = e)} style={{ display: "none" }}>
            {flyer}
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
            aria-keyshortcuts="Space ArrowUp ArrowDown"
            aria-describedby="game-controls"
            className="absolute inset-0 size-full cursor-pointer touch-none bg-transparent outline-none select-none"
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              e.preventDefault();
              // preventDefault also blocks focus; take it back so Space keeps jumping.
              e.currentTarget.focus({ preventScroll: true });
              if (e.pointerType !== "touch") {
                doJump();
                return;
              }
              endTouch();
              touch.current = {
                id: e.pointerId,
                y: e.clientY,
                decided: false,
                timer: window.setTimeout(() => {
                  const t = touch.current;
                  if (t && !t.decided) {
                    t.decided = true;
                    doJump();
                  }
                }, TAP_WAIT_MS),
              };
            }}
            onPointerMove={(e) => {
              const t = touch.current;
              if (!t || t.id !== e.pointerId) return;
              const dy = e.clientY - t.y;
              if (dy > SWIPE_PX) {
                if (!t.decided) window.clearTimeout(t.timer);
                t.decided = true;
                setDuck(true);
              } else if (dy < -SWIPE_PX && !t.decided) {
                window.clearTimeout(t.timer);
                t.decided = true;
                doJump();
              }
            }}
            onPointerUp={(e) => touch.current?.id === e.pointerId && endTouch()}
            onPointerCancel={(e) => {
              if (touch.current?.id !== e.pointerId) return;
              touch.current.decided = true;
              endTouch();
            }}
            onKeyDown={(e) => {
              if (JUMP_KEYS.has(e.key)) {
                e.preventDefault();
                doJump();
              } else if (DUCK_KEYS.has(e.key)) {
                e.preventDefault();
                setDuck(true);
              }
            }}
            onKeyUp={(e) => {
              if (DUCK_KEYS.has(e.key)) setDuck(false);
            }}
            onBlur={() => setDuck(false)}
          />
          <p id="game-controls" className="pointer-events-none absolute text-[13px] text-muted" style={{ left: edge, bottom: compact ? "4px" : "12px" }}>
            {compact ? "Tap to jump · swipe down to duck" : "Space to jump · ↓ to duck"}
          </p>
        </>
      )}

      {mode === "over" && <GameOver message={result.message} score={result.score} best={best} onAgain={play} onClose={close} />}
    </div>
  );
}
