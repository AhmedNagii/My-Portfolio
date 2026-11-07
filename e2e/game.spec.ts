import { expect, test } from "@playwright/test";

const status = (page: import("@playwright/test").Page) => page.getByRole("status").filter({ hasText: /Stopped out|Build failed/ });

test.describe("career game", () => {
  test("Play starts a run with a focused Jump button and a HUD", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Play" }).click();
    const jump = page.getByRole("button", { name: "Jump" });
    await expect(jump).toBeFocused();
    await expect(page.getByText(/Commits \d+/)).toBeVisible();
  });

  test("Space jumps without scrolling the page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Play" }).click();
    const y = await page.evaluate(() => window.scrollY);
    await page.keyboard.press("Space");
    await page.waitForTimeout(700);
    await page.keyboard.press("Space");
    expect(await page.evaluate(() => window.scrollY)).toBe(y);
  });

  test("without input the run ends; Play again restarts and Close returns", async ({ page }) => {
    test.setTimeout(40_000);
    await page.goto("/");
    await page.getByRole("button", { name: "Play" }).click();
    await expect(status(page)).toBeVisible({ timeout: 12_000 });
    await expect(page.getByRole("button", { name: "Play again" })).toBeFocused();
    await page.getByRole("button", { name: "Play again" }).click();
    await expect(status(page)).toBeHidden();
    await expect(page.getByRole("button", { name: "Jump" })).toBeVisible();
    await expect(status(page)).toBeVisible({ timeout: 12_000 });
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  });

  test("blocked storage still plays to game over", async ({ page }) => {
    test.setTimeout(30_000);
    await page.addInitScript(() => {
      Storage.prototype.getItem = () => { throw new Error("blocked"); };
      Storage.prototype.setItem = () => { throw new Error("blocked"); };
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Play" }).click();
    await expect(page.getByText("Best 0")).toBeVisible();
    await expect(status(page)).toBeVisible({ timeout: 12_000 });
  });

  test("holding Arrow Down crouches without scrolling, releasing stands up", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Play" }).click();
    const lean = () =>
      page.evaluate(() => {
        const svg = [...document.querySelectorAll('svg[role="img"]')].find((s) => s.getBoundingClientRect().width > 0)!;
        const body = svg.querySelector("image")!.parentElement!;
        return Number(/rotate\(([-\d.]+)/.exec(body.getAttribute("transform") ?? "")?.[1] ?? 0);
      });
    const y = await page.evaluate(() => window.scrollY);
    await page.keyboard.down("ArrowDown");
    await page.waitForTimeout(300);
    expect(await lean()).toBeGreaterThan(30);
    expect(await page.evaluate(() => window.scrollY)).toBe(y);
    await page.keyboard.up("ArrowDown");
    await page.waitForTimeout(300);
    expect(await lean()).toBeLessThan(10);
  });

  test("resizing to phone mid-run resets to the Play button", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Play" }).click();
    await expect(page.getByRole("button", { name: "Jump" })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible({ timeout: 1_000 });
  });

  test("Space on another control does not start the game", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
    await page.getByRole("link", { name: "Download CV" }).focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("button", { name: "Jump" })).toHaveCount(0);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the chart shows and Play does not", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('svg[role="img"]:visible')).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Play" })).toHaveCount(0);
  });
});

test.describe("career game input", () => {
  test("after clicking elsewhere, clicking the chart then Space jumps without scrolling", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Play" }).click();
    await page.locator("h1").click();
    const jump = page.getByRole("button", { name: "Jump" });
    await jump.click({ position: { x: 700, y: 300 } });
    await expect(jump).toBeFocused();
    const y = await page.evaluate(() => window.scrollY);
    await page.keyboard.press("Space");
    expect(await page.evaluate(() => window.scrollY)).toBe(y);
  });

  test("one tap is one jump", async ({ browser }) => {
    const ctx = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto("/");
    await page.getByRole("button", { name: "Play" }).tap();
    await page.waitForTimeout(600); // let the run-in finish
    await page.getByRole("button", { name: "Jump" }).tap();
    // Sample the player's height over ~1.6 s and count separate rises.
    const ys: number[] = await page.evaluate(async () => {
      const svg = [...document.querySelectorAll('svg[role="img"]')].find((s) => s.getBoundingClientRect().width > 0)!;
      const player = svg.querySelector("[data-player]")!;
      const out: number[] = [];
      for (let i = 0; i < 80; i++) {
        out.push(Number(/translate\([-\d.]+ ([-\d.]+)/.exec(player.getAttribute("transform")!)![1]));
        await new Promise((r) => setTimeout(r, 20));
      }
      return out;
    });
    // Each jump has exactly one apex: y stops falling (screen up) and starts rising.
    const jumpHeight = Math.max(...ys) - Math.min(...ys);
    expect(jumpHeight).toBeGreaterThan(40);
    let apexes = 0;
    let dir = 0;
    for (let i = 1; i < ys.length; i++) {
      const d = ys[i] - ys[i - 1];
      if (Math.abs(d) < 3) continue;
      const next = Math.sign(d);
      if (dir === -1 && next === 1) apexes++;
      dir = next;
    }
    expect(apexes).toBe(1);
    await ctx.close();
  });

  test("with a larger default font, the visible chart is the one that plays", async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Page.setFontSizes", { fontSizes: { standard: 20 } });
    await page.setViewportSize({ width: 720, height: 900 });
    await page.goto("/");
    const visible = page.locator('svg[role="img"]:visible');
    await expect(visible).toHaveCount(1);
    const before = await visible.locator("path.chart-line").getAttribute("d");
    await page.getByRole("button", { name: "Play" }).click();
    await page.waitForTimeout(500);
    expect(await visible.locator("path.chart-line").getAttribute("d")).not.toBe(before);
  });
});
