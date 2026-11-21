import { expect, test, type Page } from "@playwright/test";

const portrait = (page: Page) => page.getByRole("button", { name: /Show cartoon version/ });
const reveal = (page: Page) => portrait(page).evaluate((el) => getComputedStyle(el).getPropertyValue("--reveal").trim());

test.describe("portrait reveal", () => {
  test("hovering opens the cartoon from the pointer; leaving closes it", async ({ page }) => {
    await page.goto("/");
    const p = portrait(page);
    await expect(p).toHaveAttribute("data-state", "photo");
    expect(await reveal(page)).toBe("0%");
    const box = (await p.boundingBox())!;
    // Enter near the top-left corner: the mask is centred there.
    await page.mouse.move(box.x - 20, box.y + 40);
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.1, { steps: 2 });
    await expect(p).toHaveAttribute("data-state", "anime");
    await expect(p).toHaveAttribute("aria-pressed", "true");
    const x = parseFloat(await p.evaluate((el) => el.style.getPropertyValue("--x")));
    expect(x).toBeLessThan(30);
    // Mid-transition it's partly open, then it settles fully open.
    await expect.poll(() => reveal(page)).toBe("118%");
    // Fully open, the photo's (inverse) mask hides all of it.
    expect(await page.locator(".pu-photo").evaluate((el) => getComputedStyle(el).maskImage)).toContain("rgba(0, 0, 0, 0) 104%");
    await page.mouse.move(5, 5);
    await expect(p).toHaveAttribute("data-state", "photo");
    await expect.poll(() => reveal(page)).toBe("0%");
  });

  test("moving in and out quickly reverses smoothly from where it is", async ({ page }) => {
    await page.goto("/");
    const p = portrait(page);
    await p.hover();
    await page.waitForTimeout(200);
    await page.mouse.move(5, 5);
    const mid = parseFloat(await reveal(page));
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(118);
    await expect.poll(() => reveal(page)).toBe("0%");
  });

  test("keyboard: Enter toggles it", async ({ page }) => {
    await page.goto("/");
    const p = portrait(page);
    await p.focus();
    await page.keyboard.press("Enter");
    await expect(p).toHaveAttribute("data-state", "anime");
    await page.keyboard.press("Enter");
    await expect(p).toHaveAttribute("data-state", "photo");
  });

  test("touch: a tap toggles it", async ({ browser }) => {
    const ctx = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto("/");
    const p = portrait(page);
    await p.tap();
    await expect(p).toHaveAttribute("data-state", "anime");
    await p.tap();
    await expect(p).toHaveAttribute("data-state", "photo");
    await ctx.close();
  });

  test("reduced motion swaps with a plain fade, no mask", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await portrait(page).hover();
    await expect(portrait(page)).toHaveAttribute("data-state", "anime");
    const anime = page.locator(".pu-anime");
    expect(await anime.evaluate((el) => getComputedStyle(el).maskImage)).toBe("none");
    await expect.poll(() => anime.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    // The photo is gone, not left showing through the cartoon's transparent edges.
    await expect.poll(() => page.locator(".pu-photo").evaluate((el) => getComputedStyle(el).opacity)).toBe("0");
  });
});
