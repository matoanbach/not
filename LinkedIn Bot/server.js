import * as dotenv from "dotenv";
dotenv.config();

import playwright from "playwright";
import * as cheerio from "cheerio";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Define __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, "./playwright/.auth/user.json");
var buf = fs.readFileSync(authFile);

// URL of a random company
const companyURL = "https://www.linkedin.com/company/mdaspace/jobs/";

// LINKEDIN properties
const job_list_div_class_name = ".scaffold-layout__list-container";
const job_li_tag_pattern = 'li[id^="ember"]';
const job_des_div_class_name =
  ".job-details-jobs-unified-top-card__container--two-pane";
const jobs_apply_button = ".jobs-apply-button--top-card";
var isHeadless = false;
var allowEasyApply = false;
const job_filter_li_class_name =
  'li[class="search-reusables__filter-value-item"]';
const applyFilterKeyword = new Set(["Past week", "Internship", "Canada"]);

const browsing = async () => {
  let context;
  const browser = await playwright.chromium.launch({ headless: isHeadless });

  // create a context that can be reusable
  if (buf.length > 0) {
    console.log("[Sign In]: Reusing cookies...");
    context = await browser.newContext({ storageState: authFile });
  } else {
    console.log("[Sign In]: No cookies found. Making a new one ...");
    context = await browser.newContext();
    const page = await context.newPage();
    await signIn(page);
    await page.context().storageState({ path: authFile });
  }

  const page = await context.newPage();
  // await page.pause();
  const jobs = await visitCompany(page, companyURL);
  console.log(jobs);

  await context.close();
  await browser.close();
};

const visitCompany = async (page, companyURL) => {
  // await page.pause();
  await page.goto(companyURL);
  await click(page, page.locator('text="Show all jobs"'));
  // await page.waitForLoadState();
  await page.waitForTimeout(1000);

  // await page.locator('text="Show all jobs"').click();

  // Apply filter
  await applyFilter(page);

  // Extract jobs
  const results = await browserJobs(page);
  return results;
  // return [];
};

// const applyFilter = async (page) => {
//   await page.pause();
//   await page.locator("text=All filters", { exact: true }).click();
//   const filter_list = await page.locator(job_filter_li_class_name);
//   const count = await filter_list.count();
//   var filter_keywords;
//   for (let i = 0; i < count; i++) {
//     const rawString = await filter_list.nth(i).textContent();
//     filter_keywords = rawString
//       .replace(/\s{2,}/g, ";;")
//       .split(";;")
//       .filter((str) => str.length > 0 && !str.toLowerCase().includes("filter"));
//   }
//   filter_keywords.forEach(async (keyword) => {
//     console.log(keyword);
//     if (applyFilterKeyword.has(keyword)) {
//       const count = await filter_list.locator(keyword).count();
//       if (count > 1) {
//         await click(
//           filter_list.locator(jobs_apply_button, { exact: true }).first()
//         );
//       } else {
//         await click(filter_list.locator(jobs_apply_button, { exact: true }));
//       }
//     }
//   });

//   await page.waitForTimeout(10000);
//   return;
// };

const applyFilter = async (page) => {
  // Remove pause unless needed for debugging
  // await page.pause();

  // Click on "All filters"
  await page.locator('text="All filters"', { exact: true }).click();

  // Wait for the filters panel to appear
  await page.waitForSelector(job_filter_li_class_name);

  // Locate all filter list items
  const filter_list = await page.locator(job_filter_li_class_name);
  const count = await filter_list.count();

  // Initialize an array to accumulate filter keywords
  let filter_keywords = [];

  // Collect keywords from all filter items
  for (let i = 0; i < count; i++) {
    const rawString = await filter_list.nth(i).textContent();

    // Process the raw string to extract keywords
    const keywords = rawString
      .replace(/\s{2,}/g, ";;")
      .split(";;")
      .map((str) => str.trim())
      .filter((str) => str.length > 0 && !str.toLowerCase().includes("filter"));

    // Accumulate keywords
    filter_keywords = filter_keywords.concat(keywords);
  }

  // Ensure applyFilterKeyword is defined, e.g.,
  // const applyFilterKeyword = new Set(['Keyword1', 'Keyword2']);

  // Iterate over the keywords using for...of to handle async/await properly
  for (const keyword of filter_keywords) {
    console.log(keyword);
    if (applyFilterKeyword.has(keyword)) {
      // Locate the checkbox or filter option by label or text
      const filterOption = filter_list.locator(`text="${keyword}"`);

      // Check if the filter option exists
      const optionCount = await filterOption.count();
      if (optionCount > 0) {
        // Click on the filter option
        await click(page, filterOption.first());
      } else {
        console.warn(`Filter option "${keyword}" not found.`);
      }
    }
  }

  // Apply the filters by clicking the "Show results" or equivalent button
  // Adjust the selector as needed
  await page.click("text=/show \\d+ results/i");

  // Wait for the results to load
  // await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
};

const browserJobs = async (page) => {
  const results = [];
  // await page.pause();
  let current_page = 1;

  while (current_page === 1 || (await pageExist(page, current_page))) {
    //use the mouse to scroll down with the space bar to load all jobs first
    await click(page, page.getByLabel(`Page ${current_page}`, { exact: true }));
    await scroll(page, 10);

    const job_list_div = await page.locator(job_list_div_class_name);
    const job_list = await job_list_div.locator(job_li_tag_pattern);
    const count = await job_list.count();

    await page.waitForLoadState();

    for (let i = 0; i < count; i++) {
      await click(page, job_list.nth(i));
      const urlString = await openLink(page);
      if (urlString === "-1") continue;

      const { company, job_title, location } = await extractJob(page);
      // get the url string from the link that is just clicked
      results.push({ job_title, company, location, urlString });
    }
    current_page++;
  }

  // await page.pause();
  return results;
};

// return a job object with attributes: job title, location and company
// WARNING: subject to LinkedIn web page changes
// ALTERNATIVE: use AI to extract the whole thing
const extractJob = async (body) => {
  const job_des_div = await body.locator(job_des_div_class_name);
  const raw_job_des_div = await job_des_div.textContent();
  const descriptions = raw_job_des_div.replace(/\s{2,}/g, ";;").split(";;");
  const company = descriptions[1];
  const job_title = descriptions[4];
  const temp = descriptions[5].split("·");
  const location = temp[0];
  return { company, job_title, location };
};

const pageExist = async (page, current_page) => {
  return await page
    .getByLabel(`Page ${current_page}`, { exact: true })
    .isVisible();
};

const click = async (page, elementToClick) => {
  if (await elementToClick.isVisible()) {
    await elementToClick.click();
    await page.waitForLoadState();
  }
};

const scroll = async (page, turns) => {
  for (let i = 0; i < turns; i++) {
    await page.mouse.wheel(0, 300);
  }
};

// return url link string
const openLink = async (page) => {
  // skip easy apply
  const rawString = await page
    .locator(jobs_apply_button, { exact: true })
    .first()
    .textContent();

  if (!allowEasyApply && rawString.includes("Easy")) {
    return "-1";
  }

  // page promise - reference: https://stackoverflow.com/questions/64277178/how-to-open-the-new-tab-using-playwright-ex-click-the-button-to-open-the-new-s
  const pagePromise = page.context().waitForEvent("page");
  await click(page, page.locator(jobs_apply_button, { exact: true }).first());
  // await page.locator(jobs_apply_button, { exact: true }).first().click();
  const newPage = await pagePromise;

  // Wait for the new page to load completely
  await newPage.waitForLoadState();

  // Close the new page after processing
  await newPage.close();

  // return the new page URL
  return newPage.url();
};

const signIn = async (page) => {
  try {
    await page.pause();
    await page.goto(process.env.LINKEDIN_URL);
    await page.getByRole("link", { name: "Sign in", exact: true }).click();
    await page.getByLabel("Email or phone").click();
    await page.getByLabel("Email or phone").fill(process.env.LINKEDIN_MAIL);
    await page.getByLabel("Password").click();
    await page.getByLabel("Password").fill(process.env.LINKEDIN_PASSWORD);
    await page.getByLabel("Sign in", { exact: true }).click();
    await page.pause(); // wait for human to pass the captcha
    console.log("[Sign In]: Signed in successfully!!!");
    return true;
  } catch (error) {
    console.log("[Sign In]: Signed in unsuccessfully!!!");
    return false;
  }
};

browsing();
