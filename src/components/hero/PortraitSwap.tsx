"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import { profile } from "@/content";

/** Matches the --reveal transition in globals.css. */
const REVEAL_MS = 1000;

/**
 * Ahmed's photo. Hover (or tap, or Enter) and the cartoon version is revealed
 * through a soft circular mask that opens from where the pointer came in,
 * while the photo pushes in behind it. Leaving closes it towards where the
 * pointer left. It's a CSS transition, so it reverses smoothly at any point.
 */
export function PortraitSwap() {
  const [on, setOn] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const lastPointer = useRef("");
  const changedAt = useRef(-Infinity);

  /** Moves the mask's centre; only while settled, so a moving edge never jumps. */
  const aim = (e?: { clientX: number; clientY: number }) => {
    const el = ref.current;
    if (!el || performance.now() - changedAt.current < REVEAL_MS) return;
    const box = el.getBoundingClientRect();
    const x = e ? ((e.clientX - box.left) / box.width) * 100 : 50;
    const y = e ? ((e.clientY - box.top) / box.height) * 100 : 50;
    el.style.setProperty("--x", `${Math.min(100, Math.max(0, x)).toFixed(1)}%`);
    el.style.setProperty("--y", `${Math.min(100, Math.max(0, y)).toFixed(1)}%`);
  };

  const show = (next: boolean, e?: { clientX: number; clientY: number }) => {
    if (next === on) return;
    aim(e);
    changedAt.current = performance.now();
    setOn(next);
  };

  const mouse = (e: PointerEvent) => e.pointerType === "mouse";
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={on}
      data-state={on ? "anime" : "photo"}
      onPointerEnter={(e) => mouse(e) && show(true, e)}
      onPointerLeave={(e) => mouse(e) && show(false, e)}
      onPointerDown={(e) => void (lastPointer.current = e.pointerType)}
      onClick={(e) => {
        // A mouse already toggles by hovering; clicks are for touch and keyboard (detail 0).
        if (e.detail > 0 && lastPointer.current === "mouse") return;
        show(!on, e.detail > 0 ? e : undefined);
      }}
      className="portrait group relative block aspect-square w-full cursor-pointer rounded-full p-0 select-none"
    >
      <span className="sr-only">{profile.name}. Show cartoon version</span>
      <span aria-hidden="true" className="pu-ring absolute rounded-full border-[3px] border-brand" />
      <span aria-hidden="true" className="pu-disc absolute rounded-full bg-brand" />
      {/* Full-bleed portraits on white-matted square canvases, aligned on
          the face; object-cover keeps them undistorted at any box size. */}
      <span className="pu-cutout absolute inset-0">
        <Image
          src="/hero/ahmed-photo-backlit.webp"
          alt=""
          width={1239}
          height={1239}
          preload
          sizes="(min-width: 64rem) 420px, (min-width: 40rem) 45vw, 90vw"
          className="pu-photo absolute inset-0 size-full object-cover"
        />
        <Image
          src="/hero/ahmed-cartoon-cutout.webp"
          alt=""
          width={1140}
          height={1140}
          loading="eager"
          sizes="(min-width: 64rem) 420px, (min-width: 40rem) 45vw, 90vw"
          className="pu-anime absolute inset-0 size-full object-cover"
        />
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute bottom-[4%] left-1/2 -translate-x-1/2 rounded-full bg-bg/85 px-3 py-1 font-mono text-xs text-text backdrop-blur transition-opacity group-hover:opacity-0 group-aria-pressed:opacity-0">
        <span className="[@media(hover:none)]:hidden">hover me</span>
        <span className="hidden [@media(hover:none)]:inline">tap me</span>
      </span>
    </button>
  );
}
