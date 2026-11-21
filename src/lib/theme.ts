// Light / dark theme. The choice lives in localStorage; with none saved the
// site follows the OS. `data-theme` on <html> is the single source of truth
// the CSS and the season effects read.

export type Theme = "light" | "dark";
export const THEME_KEY = "theme";
const LIGHT_QUERY = "(prefers-color-scheme: light)";

/** Runs in <head> before paint, so the first frame already has the right theme. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}")}catch(e){}if(t!=="light"&&t!=="dark")t=matchMedia("${LIGHT_QUERY}").matches?"light":"dark";document.documentElement.setAttribute("data-theme",t)})()`;

export function storedTheme(): Theme | null {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null; // storage blocked
  }
}

export function systemTheme(): Theme {
  return window.matchMedia(LIGHT_QUERY).matches ? "light" : "dark";
}

export function currentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function saveTheme(theme: Theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage blocked: the choice lasts for this page view only.
  }
}

/**
 * Notifies on any theme change: the toggle, another tab, or the OS setting
 * (followed only while nothing is saved).
 */
export function subscribeTheme(onChange: () => void) {
  const html = document.documentElement;
  const mo = new MutationObserver(onChange);
  mo.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
  const mq = window.matchMedia(LIGHT_QUERY);
  const onSystem = () => {
    if (!storedTheme()) applyTheme(systemTheme());
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY) applyTheme(storedTheme() ?? systemTheme());
  };
  mq.addEventListener("change", onSystem);
  window.addEventListener("storage", onStorage);
  return () => {
    mo.disconnect();
    mq.removeEventListener("change", onSystem);
    window.removeEventListener("storage", onStorage);
  };
}

/** The server renders the dark default; the head script corrects it before paint. */
export const serverTheme = (): Theme => "dark";
