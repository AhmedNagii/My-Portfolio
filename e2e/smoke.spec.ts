import { expect, test } from "@playwright/test";

test("home page responds", async ({ request }) => {
  const res = await request.get("/");
  expect(res.status()).toBe(200);
});
