import { expect, test } from "@playwright/test";

test.describe("CV panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "View CV" }).or(page.getByRole("button", { name: "View CV" })).click();
  });

  test("opens with the CV text and no phone number", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Bachelor's in Law");
    await expect(dialog).toContainText("Next.js");
    await expect(dialog).not.toContainText("1129471326");
  });

  test("focus moves in, Escape closes and returns focus to the trigger", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.locator("[data-cv-trigger]")).toBeFocused();
  });

  test("Tab stays inside the dialog", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
  });

  test("Download PDF link points at the CV", async ({ page }) => {
    const link = page.getByRole("dialog").getByRole("link", { name: "Download PDF" });
    await expect(link).toHaveAttribute("href", "/Ahmed_Nagi_Front-End_Developer_CV.pdf");
    await expect(link).toHaveAttribute("download", /.+/);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("View CV is a plain link to the PDF", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-cv-trigger]")).toHaveAttribute("href", "/Ahmed_Nagi_Front-End_Developer_CV.pdf");
  });
});
