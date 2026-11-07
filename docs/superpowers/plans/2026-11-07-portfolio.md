# Ahmed Nagi Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and launch a one-page Next.js portfolio with a career chart that turns into a jump game, two work-experience cards, and a CV panel and download.

**Architecture:** One statically generated App Router page. Header, hero copy, experience and footer are server components fed by `src/content.ts`. Only `CareerGame` (SVG + `requestAnimationFrame`) and `CvPanel` (shadcn Dialog) run in the browser. All game rules live in pure TypeScript under `src/game/`, unit tested without a browser.

**Tech Stack:** Next.js (App Router, latest stable, TypeScript), Tailwind CSS v4, shadcn/ui Dialog, Motion, Vitest, Cypress, Vercel.

**Spec:** Claude Doc "Ahmed Nagi Portfolio: Design Spec", https://claude.ai/artifact/FNDCLKKrjaWG994k63kEw9 (approved 2026-11-07). Visual reference: the Claude Design canvas "Ahmed Nagi Portfolio: Live Chart", https://claude.ai/artifact/2xdZvg1A2dFZ7rbSw54AFa. Read both before starting.

## Global Constraints

- Repo name `portfolio`, owner GitHub user `AhmedNagii`. Hosted on a free Vercel address (no custom domain).
- Dark theme only, English only. No backend, no CMS, no real trading data, no axis or numbers on the chart.
- Palette tokens, exact: `bg #16191F`, `card #1D2025`, `raised #22252A`, `chip #2D3036`, `control #383B41`, `muted #A2A3A5`, `text #FFFFFF`, `accent #307EF2`, `up #0EB35B`, `down #FC3243`. Text on accent buttons is `#16191F`.
- Fonts: Manrope (text), JetBrains Mono (dates, chips, logo, score). Load with `next/font/google`.
- Shapes: pill buttons, cards with 24–28 px corners, no hard borders or grid lines.
- Copy, exact: name "Ahmed Nagi"; line "Front-End Developer working with React and Next.js"; logo `<AN />`; footer "Open to work"; game-over titles "Build failed" (bug) and "Stopped out" (candle); score label "Commits"; best label "Best".
- Contact email `ahmednagi730@gmail.com`; LinkedIn `https://www.linkedin.com/in/ahmed-mohamed-680b99232`; GitHub `https://github.com/AhmedNagii`.
- CV file served at `/Ahmed_Nagi_Front-End_Developer_CV.pdf`. The on-page CV omits the phone number.
- Everything except the game works without JavaScript. Text contrast ≥ 4.5:1. Touch targets ≥ 44 px. Character image < 50 KB. Lighthouse mobile ≥ 90.
- Compact (phone) layout and game config below a container width of 640 px.

## Review Focus

1. **Returning to a backgrounded tab:** the browser hands the loop a frame gap of seconds; the player must not teleport through obstacles. `step` clamps `dt` to `MAX_DT = 0.05` and the loop pauses on `visibilitychange` (Task 3, Task 7).
2. **Space key on the page:** pressing Space during play must jump without scrolling the page, and Space elsewhere on the page must neither start nor affect a game (Task 7).
3. **Blocked storage:** in Safari private mode `localStorage` throws; the game must still run and show Best 0 (Task 3, `bestScore` wrapper).
4. **Rotating a phone or resizing mid-game:** crossing the 640 px breakpoint while playing returns the game to idle with the new config instead of mixing two configs (Task 7).
5. **Double input on touch:** one tap fires `pointerdown` and `click`; it must produce one jump, not a jump plus a buffered second jump (Task 7, keyboard-only click handling).

---

### Task 1: Project scaffold, theme and test tooling

**Files:**
- Create: the Next.js app in `/home/claude/portfolio` (or the user's chosen folder), `src/app/globals.css`, `src/app/layout.tsx`, `vitest.config.ts`, `cypress.config.ts`, `cypress/e2e/smoke.cy.ts`, `src/lib/smoke.test.ts`
- Create: `public/character.webp` (copy of `/home/claude/character/ahmed-character.webp`), `public/Ahmed_Nagi_Front-End_Developer_CV.pdf` (copy of `/home/claude/cv-output/Ahmed_Nagi_Front-End_Developer_CV.pdf`)
- Create: `docs/superpowers/plans/2026-11-07-portfolio.md` (this file)

**Interfaces:**
- Produces: Tailwind color utilities named after the tokens (`bg-bg`, `bg-card`, `bg-raised`, `bg-chip`, `bg-control`, `text-muted`, `text-text`, `bg-accent`, `text-up`, `text-down`); font utilities `font-sans` (Manrope) and `font-mono` (JetBrains Mono); npm scripts `test` (Vitest run), `e2e` (build, start, Cypress run), `build`, `lint`.

- [ ] **Step 1:** Scaffold with `npx create-next-app@latest portfolio --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`, then `git init` if the tool did not.
- [ ] **Step 2:** In `globals.css`, define the ten palette tokens in a Tailwind v4 `@theme` block (`--color-bg`, …) and set `body` to `bg-bg text-text font-sans`.
- [ ] **Step 3:** In `layout.tsx`, load Manrope (400–800) and JetBrains Mono (400, 500) with `next/font/google` as CSS variables mapped to `--font-sans` / `--font-mono`; `<html lang="en">`.
- [ ] **Step 4:** Install `vitest`, `@vitest/coverage-v8`, `cypress`, `start-server-and-test` as dev deps. `vitest.config.ts` uses the `@` alias and `environment: 'node'`. `cypress.config.ts` sets `baseUrl: 'http://localhost:3000'`. Script `e2e` = `start-server-and-test "npm run build && npm start" http://localhost:3000 "cypress run"`.
- [ ] **Step 5:** Write `smoke.test.ts` asserting `1 + 1 === 2` and `smoke.cy.ts` asserting the page returns 200. Run `npm test` and `npm run e2e`. Expected: both PASS.
- [ ] **Step 6:** Copy the two `public/` assets and this plan into place. Confirm `public/character.webp` is under 50 KB (`ls -l`).
- [ ] **Step 7:** Commit `chore: scaffold Next.js app with theme tokens and test tooling`.

### Task 2: Site content module

**Files:**
- Create: `src/content.ts`, `src/content.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Job = { company: string; role: string; dates: string; location: string; points: [string, string, string]; tech: string[] };
  export const profile: { name: string; tagline: string; email: string; linkedin: string; github: string; cvPath: string };
  export const jobs: Job[];          // newest first
  export const cv: { summary: string; experience: { company: string; role: string; dates: string; location: string; bullets: string[] }[]; skills: string; certificates: { name: string; url?: string }[]; education: string; languages: string[] };
  ```

- [ ] **Step 1: Write the failing tests** in `content.test.ts`:
  - `jobs` has length 2; `jobs[0].company === 'Serva'`, `jobs[0].dates === 'Jan 2026 – Oct 2026'`, `jobs[0].location === 'Remote'`; `jobs[1].company === 'Solve-IT'`, `jobs[1].dates === 'Dec 2022 – Dec 2025'`, `jobs[1].location === 'Cairo, Egypt'`.
  - `jobs[0].tech` equals `['React','TypeScript','RTK Query','MUI','Tailwind']`; `jobs[1].tech` equals `['React','Redux Toolkit','PrimeReact','Leaflet','JavaScript']`.
  - `profile.tagline === 'Front-End Developer working with React and Next.js'`; `profile.cvPath === '/Ahmed_Nagi_Front-End_Developer_CV.pdf'`.
  - `JSON.stringify(cv)` does not contain `1129471326`; `cv.skills` contains `Next.js`; `cv.education` contains `Law`.
- [ ] **Step 2:** Run `npx vitest run src/content.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3:** Write `content.ts`. Card points and CV wording are copied from the canvas boards `Main.dc.html` and `Cv.dc.html` (read them with the Artifact tool, `read` action, `path` `project/Main.dc.html` and `project/Cv.dc.html`). The Udacity certificate url is `https://www.udacity.com/certificate/AMR7GFJ4`.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add site content module`.

### Task 3: Game engine (pure rules)

**Files:**
- Create: `src/game/config.ts`, `src/game/curves.ts`, `src/game/engine.ts`, `src/game/storage.ts`, `src/game/engine.test.ts`, `src/game/curves.test.ts`, `src/game/storage.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // config.ts
  export type GameConfig = { width: number; height: number; scale: number; jumpVelocity: number; gravity: number; startSpeed: number; maxSpeed: number; acceleration: number; minCandle: number; maxCandle: number; candleWidth: number; bugHeight: number; bugHalfWidth: number; bugChance: number; gapMinSec: number; gapMaxSec: number; hitWidth: number; collisionMargin: number; playerX: number; restX: number; baseline: number; wave1: number; wave2: number };
  export const DESKTOP: GameConfig; export const COMPACT: GameConfig; export const MAX_DT = 0.05; export const MAX_OBSTACLES = 4;
  // curves.ts
  export function careerY(x: number, c: GameConfig): number;
  export function terrainY(worldX: number, c: GameConfig): number;
  // engine.ts
  export type Mode = 'idle' | 'playing' | 'over';
  export type Obstacle = { kind: 'candle' | 'bug'; worldX: number; height: number };
  export type GameState = { mode: Mode; transition: number; scroll: number; distance: number; speed: number; jumpHeight: number; velocity: number; grounded: boolean; jumpBuffer: number; nextSpawnIn: number; obstacles: Obstacle[]; hitBy: 'candle' | 'bug' | null };
  export function createGame(): GameState;                       // mode 'idle'
  export function start(s: GameState, c: GameConfig): GameState;  // mode 'playing'
  export function jump(s: GameState, c: GameConfig): GameState;
  export function step(s: GameState, c: GameConfig, dt: number, rng: () => number): GameState;
  export function playerScreenX(s: GameState, c: GameConfig): number;
  export function score(s: GameState): number;                    // Math.floor(distance / 40)
  // storage.ts
  export function readBest(store?: Storage): number;               // 0 on any error
  export function writeBest(n: number, store?: Storage): void;     // swallows errors
  ```
- Config values, exact (from the approved prototype):

  | Field | DESKTOP | COMPACT |
  | --- | --- | --- |
  | width × height | 1360 × 520 | 390 × 340 |
  | scale (sprite) | 0.7 | 0.5 |
  | jumpVelocity / gravity | 800 / 1900 | 570 / 1500 |
  | startSpeed / maxSpeed / acceleration (per s) | 340 / 680 / 14 | 210 / 400 / 9 |
  | minCandle / maxCandle / candleWidth | 62 / 118 / 22 | 42 / 76 / 16 |
  | bugHeight / bugHalfWidth | 40 / 15 | 32 / 12 |
  | gapMinSec / gapMaxSec | 0.85 / 1.55 | 0.95 / 1.7 |
  | hitWidth / collisionMargin | 25 / 8 | 17 / 5 |
  | playerX / restX (fraction of width) | 0.2 / 0.84 | 0.2 / 0.8 |
  | baseline / wave1 / wave2 | 0.74 / 18 / 9 | 0.74 / 11 / 6 |

  `bugChance` is 0.35 in both.
- Curves, exact: `careerY = H * (0.86 - 0.5 * f^1.8 + 0.012 * sin(15 f))` with `f = x / W`; `terrainY = H * baseline + wave1 * sin(wx / 190) + wave2 * sin(wx / 73 + 1.3)`.
- Rules, exact: `transition` rises 2.2 per second to 1 while playing; obstacles spawn only once it is 1. First spawn after `0.9 * width` of travel; each next gap is `speed * max(gapMin + rng() * (gapMax - gapMin), 2 * jumpVelocity / gravity + 0.12)` px. A jump while airborne sets `jumpBuffer = 0.12`; landing with a buffer jumps again. Collision when `|obstacleScreenX − playerScreenX| < halfW + hitWidth * 0.55` and `jumpHeight < height − collisionMargin`, where `halfW` is `candleWidth / 2 − 2` for candles and `bugHalfWidth` for bugs; it sets `mode 'over'` and `hitBy`. Obstacles left of x −60 are removed. `playerScreenX` moves from `restX` to `playerX` with `transition`.

- [ ] **Step 1: Write failing tests** in `engine.test.ts`, each using a fixed `rng = () => 0.5`:
  - `createGame().mode === 'idle'`; `start` gives `mode 'playing'`, `speed === DESKTOP.startSpeed`, empty obstacles.
  - `jump` from the ground sets `velocity === DESKTOP.jumpVelocity`, `grounded === false`; after stepping 0.05 s repeatedly the player lands within `2 * 800 / 1900 + 0.05` s and `jumpHeight === 0`.
  - A second `jump` while airborne sets `jumpBuffer === 0.12` and does not change `velocity`; landing within the buffer starts a new jump.
  - `step(s, DESKTOP, 5, rng)` changes `distance` by exactly what `step(s, DESKTOP, 0.05, rng)` does (Review Focus 1).
  - `speed` never exceeds `maxSpeed` after 120 s of steps.
  - No obstacle spawns while `transition < 1`.
  - Consecutive spawned obstacles are at least `speed * (2 * 800 / 1900 + 0.12)` px apart.
  - A candle of height 100 placed at the player's screen x with `jumpHeight 0` ends the game with `hitBy 'candle'`; the same with `jumpHeight 95` does not.
  - `score` of a state with `distance 1000` is 25; `start` after `over` resets distance, obstacles and `hitBy`.
- [ ] **Step 2:** Write failing tests in `curves.test.ts`: `careerY(0, DESKTOP)` ≈ `0.86 * 520`; `careerY` at x = width is smaller than at 0 (line rises); `terrainY(0, DESKTOP)` ≈ `0.74 * 520 + 9 * sin(1.3)`.
- [ ] **Step 3:** Write failing tests in `storage.test.ts`: `readBest` returns 0 when `getItem` throws and when the value is not a number; `writeBest` does not throw when `setItem` throws; round-trip with a working fake storage returns the stored number. Key is `an-game-best` (Review Focus 3).
- [ ] **Step 4:** Run `npx vitest run src/game`. Expected: FAIL, modules not found.
- [ ] **Step 5:** Implement the three modules. `step` returns a new state object; it first clamps `dt` to `MAX_DT`; the obstacle list never exceeds `MAX_OBSTACLES`.
- [ ] **Step 6:** Run `npx vitest run src/game`. Expected: all PASS.
- [ ] **Step 7:** Commit `feat: add pure game engine, curves and best-score storage`.

### Task 4: Static page sections

**Files:**
- Create: `src/components/Header.tsx`, `src/components/HeroCopy.tsx`, `src/components/Experience.tsx`, `src/components/Footer.tsx`, `src/components/icons.tsx`
- Modify: `src/app/page.tsx`
- Test: `cypress/e2e/page.cy.ts`

**Interfaces:**
- Consumes: `profile`, `jobs` from `src/content.ts`.
- Produces: `icons.tsx` exports `LinkedInIcon`, `GitHubIcon`, `MailIcon`, `FileIcon`, `DownloadIcon` (inline SVG, `aria-hidden`). `HeroCopy` renders an `<a data-cv-trigger href={profile.cvPath}>View CV</a>` that Task 5 upgrades. `page.tsx` renders `Header`, `HeroCopy`, a `<div id="chart-slot">` placeholder (filled in Task 6), `Experience`, `Footer`.

- [ ] **Step 1: Write the failing test** `page.cy.ts`:
  - `h1` text is `Ahmed Nagi`; the tagline text appears.
  - `#experience article` count is 2, first `h3` is `Serva`, second is `Solve-IT`; the two cards' rendered heights are equal at 1440 × 900.
  - Links with `aria-label` `LinkedIn`, `GitHub`, `Email` exist in the footer with the Global Constraints hrefs.
  - The Download CV link has `href` `/Ahmed_Nagi_Front-End_Developer_CV.pdf` and a `download` attribute, and `cy.request` on it returns 200 with `content-type` `application/pdf`.
  - At 390 × 844 the hero icon links are not visible and `document.documentElement.scrollWidth === 390`.
- [ ] **Step 2:** Run `npm run e2e`. Expected: FAIL.
- [ ] **Step 3:** Build the four sections to match the canvas `Main.dc.html` and `Phone.dc.html` boards. Experience cards use a CSS grid with equal rows so they share one height. Nav links to `#experience`; Contact is `mailto:`.
- [ ] **Step 4:** Run `npm run e2e`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add header, hero copy, experience and footer`.

### Task 5: CV panel

**Files:**
- Create: `src/components/CvPanel.tsx` (client), `src/components/CvDocument.tsx` (server-safe markup), `src/components/ui/dialog.tsx` (via `npx shadcn@latest add dialog`)
- Modify: `src/components/HeroCopy.tsx`
- Test: `cypress/e2e/cv.cy.ts`

**Interfaces:**
- Consumes: `cv`, `profile` from `src/content.ts`.
- Produces: `<CvPanel>` wrapping the View CV trigger. Without JavaScript the trigger is the plain PDF link; with JavaScript a click calls `preventDefault()` and opens the dialog.

- [ ] **Step 1: Write the failing test** `cv.cy.ts`:
  - Clicking View CV opens `[role=dialog]` containing `Bachelor's in Law` and `Next.js`, and not containing `1129471326`.
  - Focus is inside the dialog on open; pressing Escape closes it and `document.activeElement` is the View CV trigger.
  - Tabbing from the last control in the dialog stays inside the dialog.
  - The dialog's Download PDF link has the CV `href` and `download` attribute.
- [ ] **Step 2:** Run `npm run e2e`. Expected: FAIL.
- [ ] **Step 3:** Implement `CvDocument` to match the `Cv.dc.html` board and `CvPanel` with the shadcn Dialog styled to the tokens (card `#1D2025`, 28 px corners, close button 44 px, overlay `rgba(10,12,15,0.82)`, full-screen below 640 px).
- [ ] **Step 4:** Run `npm run e2e`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add accessible CV panel with PDF fallback`.

### Task 6: Career chart at rest

**Files:**
- Create: `src/components/chart/ChartArt.tsx` (pure SVG drawing, server-safe), `src/components/chart/geometry.ts`, `src/components/chart/geometry.test.ts`
- Modify: `src/app/page.tsx` (replace `#chart-slot`)

**Interfaces:**
- Consumes: `careerY`, `DESKTOP`, `COMPACT` from Task 3.
- Produces:
  ```ts
  // geometry.ts
  export type Candle = { x: number; top: number; height: number; width: number; radius: number; up: boolean };
  export function restCandles(c: GameConfig, compact: boolean): Candle[];
  export function linePath(yAt: (x: number) => number, width: number, step: number): string;
  export function milestone(fraction: number, c: GameConfig): { x: number; y: number };
  // ChartArt.tsx
  export function ChartArt(props: { config: GameConfig; compact: boolean; animate: boolean }): JSX.Element;
  ```
- Values, exact: candles at width fractions desktop `[0.07,0.15,0.22,0.39,0.47,0.55,0.74]` heights `[86,124,72,144,102,172,134]` red indexes `[2,4]`, width 24, radius 8; compact `[0.05,0.13,0.38,0.45,0.66]` heights `[52,74,42,86,44]` red `[2]`, width 14, radius 5; body top `careerY(x) − 0.62 h`; wick 16 px past each end; candle opacity 0.8. Milestones Solve-IT 2022 at 0.3 (compact 0.24), Serva 2026 at 0.64 (compact 0.56). Line 4 px accent; fill under it a vertical accent gradient 0.16 → 0 opacity. Sprite `/character.webp` drawn `147 s × 260 s` with its bottom centre on the line at `restX`.

- [ ] **Step 1: Write failing tests** in `geometry.test.ts`: `restCandles(DESKTOP,false)` has 7 items with `up === false` only at indexes 2 and 4; compact has 5 with red only at index 2; `linePath(() => 10, 100, 10)` starts with `M0 10` and ends at x 100; `milestone(0.64, DESKTOP).x` ≈ 870.4.
- [ ] **Step 2:** Run `npx vitest run src/components/chart`. Expected: FAIL.
- [ ] **Step 3:** Implement `geometry.ts` and `ChartArt`. The SVG has `role="img"` and `aria-label` "A rising line showing Ahmed's career from Solve-IT in 2022 to Serva in 2026, with a cartoon of him at the latest point." When `animate` is true, use Motion to draw the line in once (`pathLength` 0 → 1, 1.2 s) and grow candles from the line; skip both when `useReducedMotion()` is true.
- [ ] **Step 4:** Run the unit tests. Expected: PASS. Render the page with JavaScript disabled (`cy.visit` with `script-src` blocked, or `curl` the HTML) and confirm the chart SVG and image are in the HTML.
- [ ] **Step 5:** Commit `feat: draw the career chart with candles and character`.

### Task 7: Career game component

**Files:**
- Create: `src/components/chart/CareerGame.tsx` (client), `src/components/chart/useGameLoop.ts`, `src/components/chart/GameOver.tsx`
- Modify: `src/app/page.tsx` (render `CareerGame`, which renders `ChartArt` while idle)
- Test: `cypress/e2e/game.cy.ts`

**Interfaces:**
- Consumes: everything Task 3 produces; `ChartArt`, `restCandles`, `linePath`, `milestone` from Task 6; `readBest`, `writeBest`.
- Produces: `<CareerGame />`, no props. It measures its own width with a `ResizeObserver` and picks `COMPACT` below 640 px, else `DESKTOP`.

Behavior to build, from the spec: Play button (pill, accent) under the character; while playing the line blends from `careerY` to `terrainY` by `transition`, labels and rest candles fade out by `1 − 3·transition`, the sprite moves to `playerX`, leans `sin(runPhase)·4°` on the ground and −9° in the air, tips 16° on hit, and the line turns `down` red. HUD top right in mono: `Commits <n>` and `Best <n>`. Hint bottom left: "Space or click to jump" (desktop) / "Tap to jump" (compact). Game over: `role="status"` panel with the title, `<score> commits, best <best>`, Play again (focused on open) and Close. Rendering per frame writes SVG attributes through refs; React state changes only on mode changes.

- [ ] **Step 1: Write the failing test** `game.cy.ts`, with `cy.clock()` not used (real time):
  - Clicking Play shows a button with `aria-label` `Jump` that has focus and shows text `Commits`.
  - Pressing Space twice 700 ms apart leaves `window.scrollY` unchanged (Review Focus 2).
  - Without input, within 8 s a `[role=status]` appears containing `Stopped out` or `Build failed`; Play again restarts (status gone, Jump button present); Close returns to the Play button.
  - With `localStorage.setItem` stubbed to throw (`cy.on('window:before:load')`), a full game still reaches game over and shows `Best 0` (Review Focus 3).
  - Starting a game at 1440 × 900, then `cy.viewport(390, 844)`, shows the Play button again within 1 s (Review Focus 4).
  - Pressing Space while focus is on the Download CV link does not show the Jump button.
- [ ] **Step 2:** Run `npm run e2e`. Expected: FAIL.
- [ ] **Step 3:** Implement `useGameLoop(onFrame: (dt: number) => boolean)`: a `requestAnimationFrame` loop that stops when `onFrame` returns false, pauses on `document.visibilityState === 'hidden'`, and pauses when an `IntersectionObserver` reports the chart off screen.
- [ ] **Step 4:** Implement `CareerGame` and `GameOver`. Jump input: the full-chart Jump button handles `onPointerDown` (with `preventDefault`) for mouse and touch, and `onKeyDown` for Space and Enter (with `preventDefault`); its `onClick` does nothing, so one tap is one jump (Review Focus 5). Swipes still scroll because the button uses `touch-action: manipulation` only during play. On a config change while playing, reset to `createGame()`. Render the Play button only after mount, so without JavaScript the chart shows and Play does not. Use `rng = Math.random`. Persist best with `writeBest` on game over.
- [ ] **Step 5:** Run `npm run e2e` and `npm test`. Expected: PASS.
- [ ] **Step 6:** Play by hand at desktop size and in Chrome's phone emulation; tune only the Task 3 config values if jumping feels wrong, and re-run `npm test`.
- [ ] **Step 7:** Commit `feat: turn the career chart into a playable jump game`.

### Task 8: Metadata, quality checks and launch

**Files:**
- Modify: `src/app/layout.tsx` (metadata)
- Create: `src/app/opengraph-image.tsx`, `README.md`, `cypress/e2e/a11y.cy.ts`

**Interfaces:**
- Consumes: `profile` from Task 2.

- [ ] **Step 1: Write the failing test** `a11y.cy.ts`: install `cypress-axe` and `axe-core`; the page at 1440 × 900 and at 390 × 844 has no axe violations of impact `serious` or `critical`; every `a` and `button` is at least 44 px tall or wide where visible on 390 × 844, except inline text links.
- [ ] **Step 2:** Run `npm run e2e`. Expected: FAIL on missing pieces, or PASS; fix anything flagged.
- [ ] **Step 3:** Add metadata: title "Ahmed Nagi, Front-End Developer", description "Front-End Developer working with React and Next.js. Experience, CV and a small chart game.", `metadataBase` from `process.env.VERCEL_PROJECT_PRODUCTION_URL`. `opengraph-image.tsx` renders 1200 × 630 on `#16191F` with the name, tagline and a blue rising line, using `next/og`.
- [ ] **Step 4:** Write `README.md`: what the site is, the stack, how the game engine is tested, `npm test` / `npm run e2e` commands, and that the trading chart is illustrative.
- [ ] **Step 5:** Run `npm run lint`, `npm test`, `npm run e2e`, `npm run build`. Expected: all pass.
- [ ] **Step 6:** Run Lighthouse mobile against `npm start` (`npx lighthouse http://localhost:3000 --form-factor=mobile --only-categories=performance,accessibility,best-practices,seo --quiet --chrome-flags="--headless"`). Expected: every category ≥ 90.
- [ ] **Step 7:** Commit `chore: add metadata, social image, a11y checks and README`.
- [ ] **Step 8 (needs Ahmed):** Create the public GitHub repo `AhmedNagii/portfolio`, push `main`, import it in Vercel with default settings, and confirm the live URL loads, the CV downloads and the game plays on his phone.
- [ ] **Step 9 (needs Ahmed):** Add the live URL to the CV PDF and LinkedIn, replace `public/Ahmed_Nagi_Front-End_Developer_CV.pdf` with the updated PDF, commit `chore: update CV with site link`, push.
