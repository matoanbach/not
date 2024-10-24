import playwright from "playwright";
import * as cheerio from "cheerio";
import path from "path";
import { fileURLToPath } from "url";

// Define __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

const browsing = async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Load LinkedIn URL
  await page.goto("https://www.linkedin.com/");

  // Check if the user is signed in
  const signedIn = await isSignIn(page);
  if (signedIn) {
    console.log("Successfully signed in.");

    const companyURL = "https://www.linkedin.com/company/celestica/jobs/";
    // You can add visitCompany logic here if needed
    // const jobs = await visitCompany(page, companyURL);
  } else {
    console.log("Failed to sign in.");
  }

  // Save authentication state for future use
  await page.context().storageState({ path: authFile });
  await page.pause();

  // Close browser
  await browser.close();
};

// Check if the user is already signed in
const isSignIn = async (page) => {
  try {
    // await page.pause();
    await page.getByRole("link", { name: "Sign in", exact: true }).click();
    await page.getByLabel("Email or phone").click();
    await page.getByLabel("Email or phone").fill("bachmatoan2610@gmail.com");
    await page.getByLabel("Password").click();
    await page.getByLabel("Password").fill("Toan2002123");
    await page.getByLabel("Sign in", { exact: true }).click();
    await page.pause();
    return true;
  } catch (error) {
    return false;
  }
};

// Invoke the browsing function
(async () => {
  await browsing();
})();
