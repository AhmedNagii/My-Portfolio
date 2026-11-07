const KEY = "an-game-best";

/** Best score, or 0 when storage is missing, blocked or holds junk. */
export function readBest(storage: Storage | undefined): number {
  try {
    const n = Number(storage?.getItem(KEY));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export function writeBest(best: number, storage: Storage | undefined): void {
  try {
    storage?.setItem(KEY, String(best));
  } catch {
    // Private mode or blocked storage: the best score just isn't kept.
  }
}

/** window.localStorage, or undefined where touching it throws. */
export function browserStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
