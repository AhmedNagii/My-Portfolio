"use client";

import { useEffect, useRef } from "react";

export function GameOver({ message, score, best, onAgain, onClose }: {
  message: string;
  score: number;
  best: number;
  onAgain: () => void;
  onClose: () => void;
}) {
  const again = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    again.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div
      role="status"
      className="absolute top-1/2 left-1/2 z-10 flex w-[min(340px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 rounded-3xl bg-raised p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
    >
      <p className="text-2xl font-extrabold tracking-[-0.02em]">{message}</p>
      <p className="mb-3 font-mono text-sm text-muted">
        {score} commits, best {best}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button ref={again} type="button" onClick={onAgain} className="min-h-11 cursor-pointer rounded-full bg-accent px-5 text-[15px] font-bold text-bg transition-opacity hover:opacity-85">
          Play again
        </button>
        <button type="button" onClick={onClose} className="min-h-11 cursor-pointer rounded-full bg-control px-5 text-[15px] font-semibold transition-colors hover:bg-chip">
          Close
        </button>
      </div>
    </div>
  );
}
