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
