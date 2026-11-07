import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const [w, h] of [[1440, 900], [390, 844]] as const) {
  test(`no serious or critical axe violations at ${w}×${h}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/");
    await page.waitForTimeout(1600); // let the load animation finish
    const { violations } = await new AxeBuilder({ page }).analyze();
    const bad = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
  });
}

test("visible controls on phone are at least 44 px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  const small = await page.evaluate(() =>
    [...document.querySelectorAll("a, button")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || getComputedStyle(el).visibility === "hidden") return false;
        const inline = el.tagName === "A" && el.closest("p, li") !== null;
        return !inline && r.width < 44 && r.height < 44;
      })
      .map((el) => el.outerHTML.slice(0, 80)),
  );
  expect(small).toEqual([]);
});
