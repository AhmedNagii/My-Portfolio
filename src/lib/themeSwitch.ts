import { saveTheme, type Theme } from "./theme";

export const SWEEP_MS = 900;
const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";

type ViewTransition = { ready: Promise<void>; finished: Promise<void> };
type WithViewTransitions = Document & { startViewTransition?: (update: () => void) => ViewTransition };

/**
 * Switches theme with a sweep: a glowing vertical line crosses the screen and
 * the new theme is revealed behind it (left to right into light, right to left
 * into dark). Uses View Transitions: the old page is a still snapshot and the
 * new one is clipped open in step with the line. Without View Transitions
 * support, or under reduced motion, the theme simply changes.
 */
export function switchTheme(next: Theme) {
  const doc = document as WithViewTransitions;
  if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    saveTheme(next);
    return;
  }
  const html = document.documentElement;
  const w = window.innerWidth;
  const forward = next === "light";

  // The line exists only in the "before" snapshot (it gets its own layer via
  // view-transition-name), so it can be moved independently of the page.
  const line = document.createElement("div");
  line.className = "theme-sweep-line";
  line.style.left = forward ? "-2px" : `${w - 2}px`;
  document.body.append(line);
  html.dataset.themeSwitching = "";

  const vt = doc.startViewTransition(() => {
    line.remove();
    saveTheme(next);
  });
  const anims: Animation[] = [];
  vt.ready
    .then(() => {
      const timing = { duration: SWEEP_MS, easing: EASE, fill: "both" as const };
      anims.push(
        html.animate(
        { clipPath: forward ? ["inset(0 100% 0 0)", "inset(0 0 0 0)"] : ["inset(0 0 0 100%)", "inset(0 0 0 0)"] },
          { ...timing, pseudoElement: "::view-transition-new(root)" },
        ),
        html.animate(
          { transform: ["translateX(0)", `translateX(${forward ? w : -w}px)`] },
          { ...timing, pseudoElement: "::view-transition-group(theme-sweep-line)" },
        ),
      );
    })
    .catch(() => {});
  vt.finished.finally(() => {
    // The pseudo-elements are gone; drop the held end frames with them.
    for (const a of anims) a.cancel();
    line.remove();
    delete html.dataset.themeSwitching;
  });
}
