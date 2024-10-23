const { test, expect } = require("@playwright/test");
import * as cheerio from "cheerio";

test("First Test", async ({ page }) => {
  await page.goto("https://playwright.dev/");
  const content = await page.content();
  const $ = cheerio.load(content);
  console.log($("html").text());
  await expect(page).toHaveTitle(/Playwright/);
});
