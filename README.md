# Ahmed Nagi — portfolio

My personal site: a short intro, my work experience, my CV (view in the page or download as PDF), and a hero chart you can play.

The hero is a rising career line with green and red candles and a cartoon of me standing at the latest point. Press **Play** and the line turns into a side-scrolling jump game: jump over red candles and bugs, collect commits. The candles are illustrative; there is no real market data.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, static) with React 19 and TypeScript
- Tailwind CSS v4, with the colour palette as `@theme` tokens in `src/app/globals.css`
- Radix Dialog (shadcn/ui style) for the CV panel
- Plain SVG for the chart and game, drawn every frame through refs with `requestAnimationFrame`
- Vitest for unit tests, Playwright and axe-core for end-to-end and accessibility tests
- Fonts (Manrope, JetBrains Mono) bundled locally with `next/font/local`

## How it is put together

| Path | What it holds |
| --- | --- |
| `src/content.ts` | Every piece of text on the site: profile, job cards and the CV |
| `src/game/` | The game rules as pure functions: `engine.ts` (state, physics, spawning, collisions), `curves.ts` (career line and terrain), `config.ts` (tuning for desktop and phone), `storage.ts` (best score) |
| `src/components/chart/` | `ChartArt` draws the chart at rest; `CareerGame` runs the game on top of it; `useGameLoop` is the frame loop |
| `src/components/` | Header, hero, experience cards, footer and the CV panel |

The game engine never touches the DOM, the clock or `Math.random` directly: `step(state, config, dt, rng)` takes everything it needs and returns a new state. That keeps it fully unit-tested (jump physics, the jump buffer, frame-time clamping, minimum gaps between obstacles so every run is clearable, collisions and scoring).

The chart, the CV link and all content render without JavaScript. With JavaScript, View CV opens the CV in a dialog and the Play button appears.

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
