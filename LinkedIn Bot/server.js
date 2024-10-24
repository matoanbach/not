import playwright from "playwright";
import * as cheerio from "cheerio";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Define __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, "./playwright/.auth/user.json");

const companyURL = "https://www.linkedin.com/company/celestica/jobs/";


const browsing = async () => {
  let context;
  const browser = await playwright.chromium.launch({ headless: false });
  // create a context
  if (fs.existsSync(authFile)) {
    console.log("Reusing authentication state...");
    context = await browser.newContext({ storageState: authFile });
  } else {
    console.log("No saved authentication state found. Signing in...");
    context = await browser.newContext();
    const temp_page = await context.newPage();
    await isSignIn(temp_page);
    await page.context().storageState({ path: authFile });
  }

  const page = await context.newPage();
  const jobs = await visitCompany(page, companyURL);

  await browser.close();
};

const isSignIn = async (page) => {
  try {
    // await page.pause();
    await page.getByRole("link", { name: "Sign in", exact: true }).click();
    await page.getByLabel("Email or phone").click();
    await page.getByLabel("Email or phone").fill("");
    await page.getByLabel("Password").click();
    await page.getByLabel("Password").fill("");
    await page.getByLabel("Sign in", { exact: true }).click();
    await page.pause();
    return true;
  } catch (error) {
    return false;
  }
};

const visitCompany = async (page, companyURL) => {
  const jobs = [];
  await page.goto(companyURL);
  await page.pause();

  await page.locator('text="Show all jobs"').click();

  // APPLY FILTER - to be optimized later
  await page.locator("text=All filters").click();
  const filter_div = await page.getByLabel("All filters", { exact: true });

  // const filters = ["Internship", "Quality Assurance", "Canada"];
  // filters.forEach(async (filter) => {
  //   // if ((await filter_div.getByText(filter, { exact: true }).isVisible()) && !(await filter_div.getByText(filter, { exact: true }).isChecked())) {
  //   if (await filter_div.getByText(filter, { exact: true }).isVisible()) {
  //     filter_div.getByText(filter, { exact: true }).click();
  //   }
  // });

  if (
    (await filter_div.getByText("Internship", { exact: true }).isVisible()) &&
    !(await filter_div.getByText("Internship", { exact: true }).isChecked())
  ) {
    filter_div.getByText("Internship", { exact: true }).click();
  }
  if (
    (await filter_div
      .getByText("Quality Assurance", { exact: true })
      .isVisible()) &&
    !(await filter_div
      .getByText("Quality Assurance", { exact: true })
      .isChecked())
  ) {
    filter_div.getByText("Quality Assurance", { exact: true }).click();
  }

  if (
    (await filter_div.getByText("Canada", { exact: true }).isVisible()) &&
    !(await filter_div.getByText("Canada", { exact: true }).isChecked())
  ) {
    filter_div.getByText("Canada", { exact: true }).click();
  }

  await page.getByLabel("Apply current filters to show").click();

  // this area is to take all jobs after applying job filters
  // await page.pause();
  const elementsWithJobId = await page.locator("[data-job-id]");
  for (let i = 0; i < (await elementsWithJobId.count()); i++) {
    // const job = await elementsWithJobId.nth(i).getAttribute("data-job-id");
    const rawString = await elementsWithJobId.nth(i).textContent();

    const jobString = rawString.replace(/\s{2,}/g, ";;").trim();
    const job = jobString.split(";;");

    jobs.push(job);
  }
  return jobs;
};

browsing();

