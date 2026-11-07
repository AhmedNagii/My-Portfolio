import { expect, test } from "@playwright/test";

test.describe("page sections", () => {
  test("hero shows name and tagline", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("Ahmed Nagi");
    await expect(page.getByText("Front-End Developer working with React and Next.js")).toBeVisible();
  });

  test("two experience cards of equal height, Serva first", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator("#experience article");
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0).locator("h3")).toHaveText("Serva");
    await expect(cards.nth(1).locator("h3")).toHaveText("Solve-IT");
    const [a, b] = await Promise.all([cards.nth(0).boundingBox(), cards.nth(1).boundingBox()]);
    expect(a!.height).toBe(b!.height);
  });

  test("footer has the contact icon links", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByLabel("LinkedIn")).toHaveAttribute("href", "https://www.linkedin.com/in/ahmed-mohamed-680b99232");
    await expect(footer.getByLabel("GitHub")).toHaveAttribute("href", "https://github.com/AhmedNagii");
    await expect(footer.getByLabel("Email")).toHaveAttribute("href", "mailto:ahmednagi730@gmail.com");
    await expect(footer.getByLabel("WhatsApp")).toHaveAttribute("href", "https://wa.me/ahmed_nagii7");
  });

  test("Contact opens a menu with email and WhatsApp; Escape closes it", async ({ page }) => {
    await page.goto("/");
    const contact = page.getByRole("banner").getByRole("button", { name: "Contact" });
    await contact.click();
    await expect(contact).toHaveAttribute("aria-expanded", "true");
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: /Email/ })).toHaveAttribute("href", "mailto:ahmednagi730@gmail.com");
    await expect(header.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", "https://wa.me/ahmed_nagii7");
    await expect(header.getByRole("link", { name: /Email/ })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(contact).toHaveAttribute("aria-expanded", "false");
    await expect(contact).toBeFocused();
  });

  test("Download CV serves the PDF", async ({ page, request }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: "Download CV" });
    await expect(link).toHaveAttribute("href", "/Ahmed_Nagi_Front-End_Developer_CV.pdf");
    await expect(link).toHaveAttribute("download", /.*/);
    const res = await request.get("/Ahmed_Nagi_Front-End_Developer_CV.pdf");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/pdf");
  });

  test("phone layout hides hero icons and never scrolls sideways", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator("#top").getByLabel("LinkedIn")).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });
});
