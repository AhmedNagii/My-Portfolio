# Ahmed Nagi — portfolio

My personal site: a short intro, my work experience and my CV (view in the page or download as PDF), in dark and light mode.

The hero shows my photo. Hover it (or tap it, or press Enter) and a cartoon version of me is revealed through a soft circle that opens from where the pointer came in. Snowflake crystals fall behind the hero in dark mode and autumn leaves in light mode; switching theme sweeps a glowing line across the screen that reveals the new theme behind it. Content stops growing at 1280px on wide screens.

> The `main` branch holds the earlier version, where the hero is a career chart that turns into a playable runner game.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, static) with React 19 and TypeScript
- Tailwind CSS v4, with the colour palette as `@theme` tokens in `src/app/globals.css`, overridden for `[data-theme="light"]`
- Radix Dialog (shadcn/ui style) for the CV panel
- A 2D canvas for the snow and leaves, run with `requestAnimationFrame` and paused off screen
- Vitest for unit tests, Playwright and axe-core for end-to-end and accessibility tests
- Fonts (Manrope, JetBrains Mono) bundled locally with `next/font/local`

## How it is put together

| Path | What it holds |
| --- | --- |
| `src/content.ts` | Every piece of text on the site: profile, job cards and the CV |
| `src/lib/theme.ts` | Theme logic: the inline head script that sets `data-theme` before paint, saving the choice, following the OS |
| `src/components/season/` | `particles.ts` (pure, unit-tested snow and leaf physics) and `SeasonSky`, the canvas that draws them |
| `src/lib/themeSwitch.ts` | The line-sweep theme switch (View Transitions) |
| `src/components/season/snowSprites.ts` | The snowflake crystal shapes |
| `src/components/hero/PortraitSwap.tsx` | The photo → cartoon mask reveal; images in `public/hero/` |
| `src/components/` | Header, hero, experience cards, footer and the CV panel |

The theme is set by a tiny script in `<head>` before the first paint, so there is no flash of the wrong theme. The weather is decorative: hidden from screen readers, it ignores the pointer and stands still for visitors who prefer reduced motion.

All content renders without JavaScript and follows the system theme. With JavaScript, View CV opens the CV in a dialog, the theme toggle appears and the snow or leaves start falling.

## Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests (Vitest)
npm run e2e      # builds, starts the server, runs Playwright + axe
npm run lint
npm run build
```

Playwright needs a browser once: `npx playwright install chromium`.

## Deploy

Import the repository in [Vercel](https://vercel.com/new) with the default settings. `metadataBase` picks up `VERCEL_PROJECT_PRODUCTION_URL` so the social image links resolve on the live domain.
