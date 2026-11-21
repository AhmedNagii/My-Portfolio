import { expect, test } from "@playwright/test";

const theme = (page: import("@playwright/test").Page) => page.evaluate(() => document.documentElement.dataset.theme);
const bg = (page: import("@playwright/test").Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test.describe("theme", () => {
  for (const scheme of ["dark", "light"] as const) {
    test(`follows the system ${scheme} setting with nothing saved`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      expect(await theme(page)).toBe(scheme);
      await expect(page.locator("canvas")).toHaveAttribute("data-season", scheme === "dark" ? "snow" : "leaves");
    });
  }

  test("the theme is set before any script but the head one runs", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    // Read data-theme the moment <body> starts parsing, before React loads.
    await page.addInitScript(() => {
      document.addEventListener("readystatechange", () => {
        if (document.readyState === "interactive") (window as unknown as { __early: string | undefined }).__early = document.documentElement.dataset.theme;
      });
    });
    await page.goto("/");
    expect(await page.evaluate(() => (window as unknown as { __early: string | undefined }).__early)).toBe("light");
  });

  test("the toggle switches theme, colors and season, and is remembered", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    const darkBg = await bg(page);
    await page.getByRole("button", { name: "Switch to light mode" }).click();
    await expect.poll(() => theme(page)).toBe("light");
    await expect(page.locator("canvas")).toHaveAttribute("data-season", "leaves");
    await expect.poll(() => bg(page)).not.toBe(darkBg);
    await page.reload();
    expect(await theme(page)).toBe("light");
    await expect(page.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();
  });

  test("blocked storage still toggles for the visit", async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.getItem = () => {
        throw new Error("blocked");
      };
      Storage.prototype.setItem = () => {
        throw new Error("blocked");
      };
    });
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    expect(await theme(page)).toBe("dark");
    await page.getByRole("button", { name: "Switch to light mode" }).click();
    await expect.poll(() => theme(page)).toBe("light");
  });

  test("switching sweeps a line across the screen, revealing the new theme behind it", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "no-preference" });
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to light mode" }).click();
    // While the sweep runs, the new page is clipped open and the line rides its edge.
    const running = () =>
      page.evaluate(() =>
        document
          .getAnimations()
          .map((a) => (a.effect as KeyframeEffect | null)?.pseudoElement)
          .filter(Boolean)
          .sort()
          .join(","),
      );
    await expect.poll(running).toContain("::view-transition-group(theme-sweep-line)");
    expect(await running()).toContain("::view-transition-new(root)");
    await expect.poll(running, { timeout: 3000 }).toBe("");
    expect(await theme(page)).toBe("light");
    await expect(page.locator(".theme-sweep-line")).toHaveCount(0);
    expect(await page.evaluate(() => "themeSwitching" in document.documentElement.dataset)).toBe(false);
  });

  test("reduced motion switches instantly, with no sweep", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to light mode" }).click();
    expect(await theme(page)).toBe("light");
    await expect(page.locator(".theme-sweep-line")).toHaveCount(0);
  });

  test("the weather stands still under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
    await page.goto("/");
    const snap = () => page.locator("canvas").evaluate((c: HTMLCanvasElement) => c.toDataURL());
    await page.waitForTimeout(400);
    const a = await snap();
    await page.waitForTimeout(400);
    expect(await snap()).toBe(a);
  });

  test("the weather moves with motion allowed", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference", colorScheme: "dark" });
    await page.goto("/");
    const snap = () => page.locator("canvas").evaluate((c: HTMLCanvasElement) => c.toDataURL());
    await page.waitForTimeout(400);
    const a = await snap();
    await page.waitForTimeout(400);
    expect(await snap()).not.toBe(a);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false, colorScheme: "light" });
  test("the page still follows the system theme and shows no toggle", async ({ page }) => {
    await page.goto("/");
    expect(await bg(page)).toBe("rgb(245, 243, 238)");
    await expect(page.getByRole("button", { name: /Switch to/ })).toHaveCount(0);
  });
});
