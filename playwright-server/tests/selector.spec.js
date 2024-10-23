import { test, expect } from "@playwright/test";

test("Selector Demo", async ({ page }) => {
  await page.goto("https://www.saucedemo.com/v1/");
  await page.pause();

  // using any object property
  await page.click("id=user-name");
  await page.locator('[id="user-name"]').click();
  await page.locator("id=user-name").fill("Toan");
  await page.locator('[id="user-name"]').fill("Ma");

  // using CSS selector
  await page.locator('[id="user-name"]').fill("standard_user");

  // using XPath
  await page.locator('xpath=//*[@id="password"]').fill("gg");
  // using Text
  await page.locator("text=LOGIN").click();
  await page.locator('input:has-text("LOGIN")').click();
});
