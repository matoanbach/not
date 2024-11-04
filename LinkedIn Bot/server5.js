// THIS SERVER SCRAPE AND SEND JOBS DIRECTLY TO DISCORD CHANNELS

// ENV
import * as dotenv from "dotenv";
dotenv.config();

// DEPENDENCIES
import playwright from "playwright";
import path from "path";
import fs from "fs";
import { LinkedInScraper2 } from "./src/scraper2/LinkedInScraper2.js";
import fetch from "node-fetch";

// FILE PATH
const __dirname = import.meta.dirname;
const __cookie_path = path.join(__dirname, "./playwright/.auth/user.json");

// Selectors

// Filters
// Selectors
const SELECTORS = {
  jobListContainer: ".scaffold-layout__list-container",
  jobListItem: 'li[id^="ember"]',
  jobDetailsContainer:
    ".job-details-jobs-unified-top-card__container--two-pane",
  applyButton: ".jobs-apply-button--top-card",
  filterListItem: 'li[class="search-reusables__filter-value-item"]',
  showAllJobsButton: 'text="Show all jobs"',
  allFiltersButton: 'text="All filters"',
  showResultsButton: "text=/show \\d+ result(s)?/i",
  showResultsButton2: "Apply current filters to show",
  isHeadless: true,
  allowEasyApply: false,
};

const filters = new Set(["Past 24 hours", "Internship", "Canada"]);
const jobAlerts = [
  "web development intern",
  "mobile developer intern",
  "ai engineer intern",
  "software development intern",
  "frontend developer intern",
  "fullstack developer intern",
  "software developer intern",
  "software engineering",
];
const scrapeBot = new LinkedInScraper2(
  __cookie_path,
  filters,
  process.env.LINKEDIN_MAIL,
  process.env.LINKEDIN_PASSWORD,
  process.env.LINKEDIN_URL,
  jobAlerts,
  SELECTORS
);

await scrapeBot.setUp();

const webHookUrl =
  "https://discord.com/api/webhooks/1300884474354995292/8pcJwk8R46jPjQX1TRe9kkRp5WqIYSC-uYRYw8KvSSvlUx4u0KNQpTr7LqGNsdl3F_9O";


const send = async (job) => {
  const messageContentWebhook = {
    content: `**Job Title**: ${job.job_title}\n**Company**: ${job.company}\n**Location**: ${job.location}\n[Apply Here](${job.urlString})`,
  };

  let response;
  let retryAfter;

  // Loop to retry sending a message if we hit the rate limit
  while (true) {
    response = await fetch(webHookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageContentWebhook),
    });

    if (response.ok) {
      console.log("Message sent successfully using Webhook!");
      break;
    } else if (response.status === 429) {
      // Handle rate limit error
      const retryAfterMs = (await response.json()).retry_after * 1000;
      console.log(`Rate limit hit, retrying after ${retryAfterMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
    } else {
      console.error(`Error: Failed to send message: ${response.statusText}`);
      break;
    }
  }
};


// Async function to iterate over the jobs and send messages
const run = async () => {
  const results = await scrapeBot.run();

  for (const job of results) {
    await send(job);

    setTimeout(function () {
      //your code to be executed after 1 second
    }, 1000);
  }
};

// Run the function
await run();

await scrapeBot.cleanUp();
